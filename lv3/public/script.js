// Global variables
let allMovies = [];
let cartMovies = [];

// DOM Elements
const moviesTable = document.querySelector('#movies-table tbody');
const filteredTable = document.querySelector('#filtered-table tbody');
const genreSelect = document.getElementById('filter-genre');
const yearFromInput = document.getElementById('filter-year-from');
const yearToInput = document.getElementById('filter-year-to');
const countryInput = document.getElementById('filter-country');
const ratingInput = document.getElementById('filter-rating');
const ratingValue = document.getElementById('rating-value');
const applyFiltersBtn = document.getElementById('apply-filters');
const cartList = document.getElementById('cart-list');
const cartCountValue = document.querySelector('#cart-count span');
const confirmCartBtn = document.getElementById('confirm-cart');

// Task 1: Fetch and Display Data
document.addEventListener('DOMContentLoaded', () => {
    // Fetch movie data from CSV file
    fetch('filmtv_movies.csv')
        .then(response => response.text())
        .then(csv => {
            // Parse CSV using PapaParse
            const result = Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true // Automatically convert string values to appropriate types
            });
            
            console.log('CSV Headers:', result.meta.fields);
            console.log('First row sample:', result.data[0]);
            
            // Process the data and store in global variable
            // Adapting to filmtv_movies.csv structure
            // The following mapping will adapt based on the actual column names in your CSV
            allMovies = result.data.map(movie => ({
                title: movie.title || movie.name || movie.original_title || '',
                year: Number(movie.year || movie.release_year || 0),
                genre: movie.genre || movie.genres || '',
                // Convert genre to array if it's not already
                genres: typeof movie.genre === 'string' ? 
                    movie.genre.split(';').map(g => g.trim()) : 
                    (Array.isArray(movie.genres) ? movie.genres : []),
                duration: Number(movie.duration || movie.runtime || 0),
                country: movie.country || movie.production_countries || '',
                // Convert country to array if it's not already
                countries: typeof movie.country === 'string' ? 
                    movie.country.split(';').map(c => c.trim()) : 
                    (Array.isArray(movie.production_countries) ? movie.production_countries : []),
                vote_count: Number(movie.total_votes || movie.vote_count || 0),
                vote_average: Number(movie.avg_vote || movie.vote_average || 0),
                directors: movie.directors || '',
                description: movie.description || movie.overview || ''
            }));
            
            console.log('Processed movies sample:', allMovies[0]);
            
            // Removing any empty objects or invalid data
            allMovies = allMovies.filter(movie => movie.title && movie.year);
            
            // Display initial set of movies
            displayMovies(allMovies.slice(0, 10), moviesTable);
            
            // Populate genre filter with unique genres
            populateGenreFilter();
            
            // Set up event listeners
            setupEventListeners();
        })
        .catch(err => {
            console.error('Error fetching or parsing CSV:', err);
            moviesTable.innerHTML = `<tr><td colspan="6">Error loading movie data. Please try again later.</td></tr>`;
        });
});

// Function to display movies in a table
function displayMovies(movies, tableBody) {
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if movies array is empty
    if (movies.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">No movies found matching your criteria.</td></tr>`;
        return;
    }
    
    // Create and append rows for each movie
    movies.forEach(movie => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${movie.title}</td>
            <td>${movie.year}</td>
            <td>${Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genre}</td>
            <td>${movie.duration} min</td>
            <td>${Array.isArray(movie.countries) ? movie.countries.join(', ') : movie.country}</td>
            <td>${movie.vote_average}</td>
            ${tableBody === filteredTable ? 
                `<td><button class="add-to-cart-btn" data-title="${movie.title}">Dodaj u košaricu</button></td>` : 
                ''}
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to add-to-cart buttons if they exist
    if (tableBody === filteredTable) {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCart);
        });
    }
}

// Populate genre filter with unique genres from data
function populateGenreFilter() {
    // Get all unique genres
    const genres = new Set();
    
    allMovies.forEach(movie => {
        if (Array.isArray(movie.genres)) {
            movie.genres.forEach(genre => {
                if (genre && genre.trim() !== '') {
                    genres.add(genre.trim());
                }
            });
        } else if (typeof movie.genre === 'string' && movie.genre.trim() !== '') {
            // If genre is a string, add it directly
            genres.add(movie.genre.trim());
        }
    });
    
    // Add options to select element
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Update rating value display when slider is changed
    ratingInput.addEventListener('input', () => {
        ratingValue.textContent = ratingInput.value;
    });
    
    // Filter button click
    applyFiltersBtn.addEventListener('click', filterMovies);
    
    // Confirm cart button
    confirmCartBtn.addEventListener('click', confirmCart);
}

// Task 2: Filter Movies
function filterMovies() {
    const selectedGenre = genreSelect.value.trim();
    const yearFrom = yearFromInput.value ? parseInt(yearFromInput.value) : 0;
    const yearTo = yearToInput.value ? parseInt(yearToInput.value) : 3000;
    const country = countryInput.value.trim().toLowerCase();
    const minRating = parseFloat(ratingInput.value);
    
    // Apply filters
    const filteredMovies = allMovies.filter(movie => {
        // Genre filter
        const genreMatch = selectedGenre === '' || 
            (Array.isArray(movie.genres) && movie.genres.includes(selectedGenre)) ||
            (typeof movie.genre === 'string' && movie.genre.includes(selectedGenre));
        
        // Year range filter
        const yearMatch = movie.year >= yearFrom && movie.year <= yearTo;
        
        // Country filter
        const countryMatch = country === '' || 
            (Array.isArray(movie.countries) && 
                movie.countries.some(c => c.toLowerCase().includes(country))) ||
            (typeof movie.country === 'string' && 
                movie.country.toLowerCase().includes(country));
        
        // Rating filter
        const ratingMatch = movie.vote_average >= minRating;
        
        // Return true only if all conditions are met
        return genreMatch && yearMatch && countryMatch && ratingMatch;
    });
    
    // Display filtered results
    displayMovies(filteredMovies, filteredTable);
}

// Task 3: Cart Functionality
function handleAddToCart(event) {
    const movieTitle = event.target.getAttribute('data-title');
    const movie = allMovies.find(m => m.title === movieTitle);
    
    // Check if movie is already in cart
    if (cartMovies.some(m => m.title === movieTitle)) {
        alert('Film je već u košarici!');
        return;
    }
    
    // Add to cart array
    cartMovies.push(movie);
    
    // Update cart display
    updateCartDisplay();
}

function updateCartDisplay() {
    // Clear current cart
    cartList.innerHTML = '';
    
    // Add each movie to cart list
    cartMovies.forEach((movie, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div>
                <strong>${movie.title}</strong> (${movie.year})
                <div>${Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genre}</div>
            </div>
            <button class="remove-from-cart" data-index="${index}">Ukloni</button>
        `;
        cartList.appendChild(li);
    });
    
    // Update cart count
    cartCountValue.textContent = cartMovies.length;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', handleRemoveFromCart);
    });
}

function handleRemoveFromCart(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    
    // Remove from cart array
    cartMovies.splice(index, 1);
    
    // Update cart display
    updateCartDisplay();
}

function confirmCart() {
    if (cartMovies.length === 0) {
        alert('Košarica je prazna!');
        return;
    }
    
    // Display confirmation message
    alert(`Uspješno ste dodali ${cartMovies.length} film${cartMovies.length !== 1 ? 'a' : ''} u svoju košaricu za vikend maraton!`);
    
    // Clear cart
    cartMovies = [];
    updateCartDisplay();
}

// Helper function for sorting (can be used for additional functionality)
function sortMovies(movies, field, ascending = true) {
    return [...movies].sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];
        
        const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return ascending ? compareResult : -compareResult;
    });
}

// Optional: Save cart to localStorage for persistence
function saveCartToLocalStorage() {
    localStorage.setItem('movieCart', JSON.stringify(cartMovies));
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('movieCart');
    if (savedCart) {
        cartMovies = JSON.parse(savedCart);
        updateCartDisplay();
    }
}