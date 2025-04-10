const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 5500;

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/slike');
});

app.get('/slike', (req, res) => {
  const folderPath = path.join(__dirname, 'public', 'images');
  const files = fs.readdirSync(folderPath);

  const images = files
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.svg'))
    .map((file, index) => ({
      url: `/images/${file}`,
      id: `slika${index + 1}`,
      title: `Slika ${index + 1}`,
      largeUrl: `/images/${file}`
    }));

  res.render('slike', { images });
});

app.get('/slike-json', (req, res) => {
  const dataPath = path.join(__dirname, 'images.json');
  const images = JSON.parse(fs.readFileSync(dataPath));
  res.render('slike', { images });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});