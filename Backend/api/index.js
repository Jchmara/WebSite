require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE, 
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Test de connexion à la base de données au démarrage
pool.connect()
  .then(client => {
    return client.query('SELECT 1')
      .then(() => {
        console.log('Connexion à la base de données réussie');
        client.release();
      })
      .catch(err => {
        console.error('Erreur de connexion à la base de données:', err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // En dev : '*', en prod : l’URL de ton front
  credentials: true
}));
app.use(bodyParser.json());
app.use((err, req, res, next) => {
  res.status(400).json({ error: 'Erreur de parsing JSON' });
});

// --- Middleware d'authentification par clé API ---
// Pour la sécurité, la clé API doit être forte et secrète.
// Elle peut être définie dans un fichier .env (recommandé) ou en dur pour les tests.
// Exemple de génération de clé aléatoire en Node.js :
//   require('crypto').randomBytes(24).toString('base64')
//
// La clé API est lue depuis le .env ou prend une valeur par défaut si absente.
const API_KEY = process.env.API_KEY || 'Qw7!pL9z@Xy2#vRt6';

const apiAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Clé API manquante ou invalide' });
  }
  next();
};

// Route publique pour l'inscription : liste des équipes hors admin
app.get('/api/equipes-public', async (req, res) => {
  try {
    const equipes = await pool.query("SELECT id_equipe AS id, nom FROM equipe WHERE nom != 'admin' ORDER BY nom");
    res.json(equipes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', apiAuth);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt';
const JWT_EXPIRES_IN = '8h'; // Durée de validité du token

// --- Middleware JWT ---
const authJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

// --- Route d'inscription ---
app.post('/api/register', async (req, res) => {
  const { nom, prenom, email, password, id_equipe, role } = req.body;
  if (!nom || !prenom || !email || !password || !id_equipe) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO utilisateur (nom, prenom, email, password, id_equipe, role, actif, date_creation) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id_utilisateur, nom, prenom, email, id_equipe, role, actif',
      [nom, prenom, email, hash, id_equipe, role || 'user', false]
    );
    res.status(201).json({ user: result.rows[0], message: 'Votre demande a été envoyée, un administrateur doit la valider.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    res.status(500).json({ error: err.message });
  }
});

// --- Route de connexion ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  try {
    const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur inconnu' });
    }
    const user = result.rows[0];
    if (!user.actif) {
      return res.status(403).json({ error: 'Votre compte n’a pas encore été validé par un administrateur.' });
    }
    // --- Réactivation de la vérification du mot de passe ---
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    const token = jwt.sign({ id: user.id_utilisateur, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, email: user.email, id_equipe: user.id_equipe, role: user.role, actif: user.actif } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Gestion des présences avec PostgreSQL ---
app.get('/api/presences', authJWT, async (req, res) => {
  const week = parseInt(req.query.week, 10);
  const year = parseInt(req.query.year, 10);
  const userId = req.user.id;
  if (!week || !year) {
    return res.status(400).json({ error: 'week et year requis' });
  }
  try {
    const result = await pool.query(
      'SELECT presences, code_projet, desc_projet, codes_projet FROM presences WHERE year = $1 AND week = $2 AND id_utilisateur = $3',
      [year, week, userId]
    );
    if (result.rows.length === 0) {
      return res.json({ presences: [null, null, null, null, null], codesProjet: ['', '', '', '', ''], codeProjet: '', descProjet: '' });
    }
    const row = result.rows[0];
    let codesProjet = ['', '', '', '', ''];
    if (row.codes_projet) {
      try { codesProjet = JSON.parse(row.codes_projet); } catch {}
    } else if (row.code_projet) {
      // rétrocompatibilité : remplir tous les jours avec l'ancien code projet unique
      codesProjet = [row.code_projet, row.code_projet, row.code_projet, row.code_projet, row.code_projet];
    }
    res.json({ presences: row.presences, codesProjet, codeProjet: row.code_projet, descProjet: row.desc_projet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/presences', authJWT, async (req, res) => {
  const week = parseInt(req.body.week, 10);
  const year = parseInt(req.body.year, 10);
  const { presences, codesProjet } = req.body;
  const userId = req.user.id;

  try {
    // Si tous les jours sont null, on efface la semaine
    if (presences.every(n => n === null)) {
      await pool.query(
        'DELETE FROM presences WHERE id_utilisateur = $1 AND week = $2 AND year = $3',
        [userId, week, year]
      );
      return res.json({ success: true, message: 'Semaine effacée' });
    }

    // Sinon, on met à jour ou insère la semaine
    await pool.query(
      `INSERT INTO presences (id_utilisateur, week, year, presences, codes_projet)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_utilisateur, week, year)
       DO UPDATE SET presences = $4, codes_projet = $5`,
      [userId, week, year, JSON.stringify(presences), JSON.stringify(codesProjet)]
    );
    // Finir la requête HTTP même si rien n'est renvoyé
    return res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Gestion des projets avec PostgreSQL ---
// GET /api/projets : filtrer par utilisateur connecté
app.get('/api/projets', authJWT, async (req, res) => {
  const week = parseInt(req.query.week, 10);
  const year = parseInt(req.query.year, 10);
  const userId = req.user.id;
  if (!week || !year) {
    return res.status(400).json({ error: 'week et year requis' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM projet WHERE year = $1 AND week = $2 AND id_utilisateur = $3 ORDER BY id_projet',
      [year, week, userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projets : forcer l'id_utilisateur à l'utilisateur connecté
app.post('/api/projets', authJWT, async (req, res) => {
  const week = parseInt(req.query.week, 10);
  const year = parseInt(req.query.year, 10);
  const userId = req.user.id;
  const { projets } = req.body;
  if (!week || !year) {
    return res.status(400).json({ error: 'week et year requis' });
  }
  if (!Array.isArray(projets)) {
    return res.status(400).json({ error: 'projets doit être un tableau' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM projet WHERE year = $1 AND week = $2 AND id_utilisateur = $3', [year, week, userId]);
    const role = req.user.role;
    for (const p of projets) {
      let idUser = userId;
      if ((role === 'manager' || role === 'admin') && p.id_utilisateur) {
        // Vérifier que l'utilisateur cible appartient à la même équipe que le manager
        const equipeManagerRes = await client.query('SELECT id_equipe FROM equipe_utilisateur WHERE id_utilisateur = $1', [userId]);
        if (equipeManagerRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: "Manager sans équipe, affectation interdite." });
        }
        const idEquipeManager = equipeManagerRes.rows[0].id_equipe;
        const equipeCibleRes = await client.query('SELECT id_equipe FROM equipe_utilisateur WHERE id_utilisateur = $1', [p.id_utilisateur]);
        if (equipeCibleRes.rows.length === 0 || equipeCibleRes.rows[0].id_equipe !== idEquipeManager) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: "Affectation interdite : l'utilisateur n'est pas dans votre équipe." });
        }
        idUser = p.id_utilisateur;
      } else if (role === 'superadmin' && p.id_utilisateur) {
        idUser = p.id_utilisateur;
      }
      await client.query(
        'INSERT INTO projet (year, week, nom, pourcentage, commentaire, id_utilisateur, code_projet) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          year,
          week,
          p.nom,
          parseInt(p.pourcentage, 10) || 0,
          p.commentaire,
          idUser,
          p.codeProjet || p.code_projet || ''
        ]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Route pour lister les équipes ---
app.get('/api/equipes', authJWT, async (req, res) => {
  try {
    const { role } = req.user;
    const equipes = await pool.query("SELECT id_equipe AS id, nom FROM equipe WHERE nom != 'admin' ORDER BY nom");
    const membres = await pool.query(`
      SELECT eu.id_equipe, u.id_utilisateur AS id, u.nom, u.prenom, eu.role_equipe
      FROM equipe_utilisateur eu
      JOIN utilisateur u ON u.id_utilisateur = eu.id_utilisateur
      JOIN equipe e ON eu.id_equipe = e.id_equipe
      WHERE u.actif = true AND eu.role_equipe NOT IN ('admin', 'superadmin') AND e.nom != 'admin'${role !== 'admin' && role !== 'superadmin' ? ' AND u.is_visible = true' : ''}
    `);
    const equipeList = equipes.rows.map(eq => ({
      ...eq,
      members: membres.rows.filter(m => m.id_equipe === eq.id).map(m => `${m.prenom} ${m.nom}`)
    }));
    res.json(equipeList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lister tous les utilisateurs actifs ---
app.get('/api/utilisateurs', authJWT, async (req, res) => {
  try {
    const { id, role } = req.user;
    let usersQuery = '';
    let usersParams = [];
    if (role === 'superadmin' || role === 'admin') {
      usersQuery = `
        SELECT u.id_utilisateur AS id, u.nom, u.prenom, u.role, eu.role_equipe
        FROM utilisateur u
        JOIN equipe_utilisateur eu ON u.id_utilisateur = eu.id_utilisateur
        WHERE u.actif = true AND eu.role_equipe != 'admin' AND eu.role_equipe != 'superadmin'
        ORDER BY u.nom, u.prenom
      `;
    } else {
      // Récupérer l'équipe du manager
      const equipeRes = await pool.query('SELECT id_equipe FROM equipe_utilisateur WHERE id_utilisateur = $1', [id]);
      if (equipeRes.rows.length === 0) return res.json([]);
      const idEquipe = equipeRes.rows[0].id_equipe;
      usersQuery = `
        SELECT u.id_utilisateur AS id, u.nom, u.prenom, u.role, eu.role_equipe
        FROM utilisateur u
        JOIN equipe_utilisateur eu ON u.id_utilisateur = eu.id_utilisateur
        WHERE u.actif = true AND eu.id_equipe = $1 AND u.id_utilisateur != $2 AND u.is_visible = true
        ORDER BY u.nom, u.prenom
      `;
      usersParams = [idEquipe, id];
    }
    const usersRes = await pool.query(usersQuery, usersParams);
    const users = usersRes.rows;
    // Pour chaque utilisateur, récupérer tous ses projets
    for (const user of users) {
      const projetsRes = await pool.query(
        'SELECT year, week, nom, pourcentage, commentaire, code_projet FROM projet WHERE id_utilisateur = $1 ORDER BY year DESC, week DESC',
        [user.id]
      );
      user.projets = projetsRes.rows;
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lister tous les projets distincts ---
app.get('/api/all-projets', authJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_projet AS id, nom AS name, id_utilisateur, pourcentage, commentaire, code_projet, year, week FROM projet ORDER BY nom'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Récupérer les infos d’un utilisateur par id ---
app.get('/api/utilisateur/:id', authJWT, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('SELECT nom, prenom FROM utilisateur WHERE id_utilisateur = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Middleware pour vérifier le rôle admin/superadmin ---
const checkAdminRole = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }
    req.user = user;
    next();
  });
};

// --- Admin : lister les utilisateurs en attente de validation ---
app.get('/api/admin/utilisateurs-attente', checkAdminRole, async (req, res) => {
  try {
    const result = await pool.query('SELECT id_utilisateur, nom, prenom, email, id_equipe, role, date_creation FROM utilisateur WHERE actif = false ORDER BY date_creation');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin : valider un utilisateur (activer) ---
app.post('/api/admin/valider-utilisateur', checkAdminRole, async (req, res) => {
  const { id_utilisateur } = req.body;
  if (!id_utilisateur) return res.status(400).json({ error: 'id_utilisateur requis' });
  try {
    await pool.query('UPDATE utilisateur SET actif = true WHERE id_utilisateur = $1', [id_utilisateur]);
    // Récupérer l'équipe et le rôle de l'utilisateur
    const userRes = await pool.query('SELECT id_equipe, role FROM utilisateur WHERE id_utilisateur = $1', [id_utilisateur]);
    if (userRes.rows.length > 0) {
      const { id_equipe, role } = userRes.rows[0];
      // Vérifier si déjà présent dans equipe_utilisateur
      const existsRes = await pool.query(
        'SELECT 1 FROM equipe_utilisateur WHERE id_equipe = $1 AND id_utilisateur = $2',
        [id_equipe, id_utilisateur]
      );
      if (id_equipe && existsRes.rows.length === 0) {
        await pool.query(
          'INSERT INTO equipe_utilisateur (id_equipe, id_utilisateur, role_equipe) VALUES ($1, $2, $3)',
          [id_equipe, id_utilisateur, role === 'manager' ? 'manager' : 'membre']
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin : supprimer/refuser un utilisateur ---
app.delete('/api/admin/supprimer-utilisateur/:id', checkAdminRole, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id_utilisateur requis' });
  try {
    await pool.query('DELETE FROM utilisateur WHERE id_utilisateur = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reporting par utilisateur ---
app.get('/api/reporting/user/:id', authJWT, async (req, res) => {
  const id = req.params.id;
  const { startYear, startWeek, endYear, endWeek } = req.query;
  // Calculer la liste des semaines dans la période
  function getWeeksInRange(startY, startW, endY, endW) {
    const result = [];
    let y = Number(startY), w = Number(startW);
    const eY = Number(endYear), eW = Number(endWeek);
    while (y < eY || (y === eY && w <= eW)) {
      result.push({ year: y, week: w });
      w++;
      if (w > 52) { w = 1; y++; }
    }
    return result;
  }
  const weeks = getWeeksInRange(startYear, startWeek, endYear, endWeek);
  let totalJours = 0;
  let joursRenseignes = 0;
  let joursSurSite = 0;
  let projetsOccupation = {};
  let totalPourcentage = 0;
  let barData = [];
  try {
    for (const { year, week } of weeks) {
      // Présences de l’utilisateur
      const pres = await pool.query(
        'SELECT presences FROM presences WHERE year = $1 AND week = $2 AND EXISTS (SELECT 1 FROM utilisateur WHERE id_utilisateur = $3)',
        [year, week, id]
      );
      if (pres.rows.length > 0 && Array.isArray(pres.rows[0].presences)) {
        totalJours += pres.rows[0].presences.length;
        joursRenseignes += pres.rows[0].presences.filter(n => Number.isInteger(n)).length;
        joursSurSite += pres.rows[0].presences.filter(n => n === 0).length;
      }
      // Projets de l’utilisateur (exemple : tous les projets de la semaine)
      const projs = await pool.query(
        'SELECT nom, pourcentage FROM projet WHERE year = $1 AND week = $2',
        [year, week]
      );
      if (projs.rows.length > 0) {
        for (const p of projs.rows) {
          if (p.nom && p.pourcentage) {
            projetsOccupation[p.nom] = (projetsOccupation[p.nom] || 0) + parseFloat(p.pourcentage);
            totalPourcentage += parseFloat(p.pourcentage);
          }
        }
        // Pour le bar chart, on suppose les projets A/B/C (à adapter selon tes données)
        let bar = { semaine: `S${week}` };
        for (const p of projs.rows) {
          bar[p.nom] = parseFloat(p.pourcentage);
        }
        barData.push(bar);
      }
    }
    const tauxPresence = totalJours > 0 ? Math.round((joursRenseignes / totalJours) * 100) : 0;
    let occupationParProjet = [];
    for (const [nom, val] of Object.entries(projetsOccupation)) {
      occupationParProjet.push({ nom, pourcentage: Math.round((val / totalPourcentage) * 100) });
    }
    occupationParProjet.sort((a, b) => b.pourcentage - a.pourcentage);
    res.json({ tauxPresence, occupationParProjet, joursSurSite, barData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reporting par projet ---
app.get('/api/reporting/projet/:nom', authJWT, async (req, res) => {
  const nomProjet = req.params.nom;
  const { startYear, startWeek, endYear, endWeek } = req.query;
  function getWeeksInRange(startY, startW, endY, endW) {
    const result = [];
    let y = Number(startY), w = Number(startW);
    const eY = Number(endYear), eW = Number(endWeek);
    while (y < eY || (y === eY && w <= eW)) {
      result.push({ year: y, week: w });
      w++;
      if (w > 52) { w = 1; y++; }
    }
    return result;
  }
  const weeks = getWeeksInRange(startYear, startWeek, endYear, endWeek);
  let people = {};
  let totalPourcentage = 0;
  try {
    for (const { year, week } of weeks) {
      // On suppose une table projet avec un champ "nom" et "pourcentage" et un lien utilisateur
      const rows = await pool.query(
        `SELECT u.nom, u.prenom, p.pourcentage
         FROM projet p
         JOIN utilisateur u ON p.nom = $1 AND u.id_utilisateur = p.id_utilisateur
         WHERE p.year = $2 AND p.week = $3`,
        [nomProjet, year, week]
      );
      for (const r of rows.rows) {
        const key = r.prenom + ' ' + r.nom;
        people[key] = (people[key] || 0) + parseFloat(r.pourcentage);
        totalPourcentage += parseFloat(r.pourcentage);
      }
    }
    // Calcul du pourcentage par personne
    let result = [];
    for (const [name, val] of Object.entries(people)) {
      result.push({ name, pourcentage: Math.round((val / totalPourcentage) * 100) });
    }
    result.sort((a, b) => b.pourcentage - a.pourcentage);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reporting par équipe ---
app.get('/api/reporting/team/:id', authJWT, async (req, res) => {
  const idEquipe = req.params.id;
  const { startYear, startWeek, endYear, endWeek } = req.query;
  const { role } = req.user;
  function getWeeksInRange(startY, startW, endY, endW) {
    const result = [];
    let y = Number(startY), w = Number(startW);
    const eY = Number(endYear), eW = Number(endWeek);
    while (y < eY || (y === eY && w <= eW)) {
      result.push({ year: y, week: w });
      w++;
      if (w > 52) { w = 1; y++; }
    }
    return result;
  }
  const weeks = getWeeksInRange(startYear, startWeek, endYear, endWeek);
  try {
    // Récupérer les membres actifs de l'équipe
    const membresRes = await pool.query(`SELECT id_utilisateur, nom, prenom FROM utilisateur WHERE id_equipe = $1 AND actif = true${role !== 'admin' && role !== 'superadmin' ? ' AND is_visible = true' : ''}`, [idEquipe]);
    const membres = membresRes.rows;
    if (membres.length === 0) {
      return res.json({ tauxMoyen: 0, nbMembres: 0, membres: [], camembert: [] });
    }
    let totalTaux = 0;
    let totalSurSite = 0;
    let totalJours = 0;
    let membresStats = [];
    for (const membre of membres) {
      let joursRenseignes = 0;
      let joursSurSite = 0;
      let joursTotal = 0;
      for (const { year, week } of weeks) {
        // Chercher les présences de ce membre pour chaque semaine
        const presRes = await pool.query(
          'SELECT presences FROM presences WHERE year = $1 AND week = $2 AND EXISTS (SELECT 1 FROM utilisateur WHERE id_utilisateur = $3)',
          [year, week, membre.id_utilisateur]
        );
        if (presRes.rows.length > 0 && Array.isArray(presRes.rows[0].presences)) {
          const pres = presRes.rows[0].presences;
          joursTotal += pres.length;
          joursRenseignes += pres.filter(n => Number.isInteger(n)).length;
          joursSurSite += pres.filter(n => n === 0).length;
        }
      }
      const taux = joursTotal > 0 ? Math.round((joursRenseignes / joursTotal) * 100) : 0;
      membresStats.push({ name: membre.prenom + ' ' + membre.nom, taux });
      totalTaux += taux;
      totalSurSite += joursSurSite;
      totalJours += joursTotal;
    }
    const tauxMoyen = membresStats.length > 0 ? Math.round((totalTaux / membresStats.length)) : 0;
    const camembert = [
      { type: 'Sur site', value: totalJours > 0 ? Math.round((totalSurSite / totalJours) * 100) : 0 },
      { type: 'Autres', value: totalJours > 0 ? 100 - Math.round((totalSurSite / totalJours) * 100) : 0 }
    ];
    res.json({ tauxMoyen, nbMembres: membresStats.length, membres: membresStats, camembert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lister les membres de la même équipe que l'utilisateur connecté ---
app.get('/api/equipe/membres', authJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;
    // Récupérer toutes les équipes de l'utilisateur connecté
    const equipesRes = await pool.query('SELECT id_equipe FROM equipe_utilisateur WHERE id_utilisateur = $1', [userId]);
    if (equipesRes.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non affecté à une équipe' });
    const equipeIds = equipesRes.rows.map(row => row.id_equipe);
    // Récupérer tous les membres de ces équipes avec le nom de l'équipe
    const membres = await pool.query(`
      SELECT u.id_utilisateur AS id, u.nom, u.prenom, t.nom AS team_name, t.id_equipe
      FROM utilisateur u
      JOIN equipe_utilisateur eu ON u.id_utilisateur = eu.id_utilisateur
      JOIN equipe t ON eu.id_equipe = t.id_equipe
      WHERE eu.id_equipe = ANY($1)${role !== 'admin' && role !== 'superadmin' ? ' AND u.is_visible = true' : ''}
      ORDER BY t.nom, u.nom, u.prenom
    `, [equipeIds]);
    res.json(membres.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route Swagger UI pour la documentation interactive
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API démarrée sur http://0.0.0.0:${PORT}`);
});
