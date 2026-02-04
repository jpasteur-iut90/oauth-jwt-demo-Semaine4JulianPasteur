require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(passport.initialize());

const client = new MongoClient(process.env.MONGODB_URI);

client.connect()
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.locals.db = client.db();
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '🎓 OAuth + JWT Demo - Backend Express + MongoDB',
    endpoints: {
      'POST /auth/register': 'Créer un compte (email/password)',
      'POST /auth/login': 'Se connecter (email/password)',
      'GET /auth/google': 'Se connecter avec Google',
      'GET /auth/google/callback': 'Callback Google OAuth',
      'GET /auth/github': 'Se connecter avec GitHub',
      'GET /auth/github/callback': 'Callback GitHub OAuth',
      'GET /auth/discord': 'Se connecter avec Discord',
      'GET /auth/discord/callback': 'Callback Discord OAuth',
      'GET /auth/profile': 'Profil (protégé par JWT)',
      'GET /auth/users': 'Liste utilisateurs (debug)'
    },
    database: 'MongoDB Native Driver',
    authentication: 'JWT stateless + Google/GitHub/Discord OAuth 2.0',
    cors: 'Configuré pour Vue.js'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Base de données: ${process.env.MONGODB_URI}`);
  console.log(`🌐 Frontend autorisé: ${process.env.FRONTEND_URL}`);
});

process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB déconnecté');
  process.exit(0);
});
