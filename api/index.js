const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Stockage en mémoire (à remplacer par une base de données plus tard)
let presences = [null, null, null, null, null]; // Lundi à Vendredi

// Récupérer les présences
app.get('/api/presences', (req, res) => {
  res.json(presences);
});

// Mettre à jour les présences
app.post('/api/presences', (req, res) => {
  presences = req.body.presences;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
