const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { findUserByEmail, findUserById, createUser, comparePassword } = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

const handleOAuthCallback = (req, res) => {
  try {
    const token = generateToken(req.user._id);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Erreur génération token OAuth:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
  }
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = req.app.locals.db;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Email, mot de passe et nom sont requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Mot de passe invalide',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const existingUser = await findUserByEmail(db, email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email déjà utilisé',
        message: 'Un compte existe déjà avec cet email'
      });
    }

    const user = await createUser(db, { email, password, name });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Email et mot de passe requis'
      });
    }

    const user = await findUserByEmail(db, email);
    if (!user) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Connexion réussie',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        picture: user.picture
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Profil utilisateur',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      message: 'Liste des utilisateurs',
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});



router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }),
  handleOAuthCallback
);

router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_auth_failed` }),
  handleOAuthCallback
);

router.get('/discord',
  passport.authenticate('discord', { scope: ['identify', 'email'], session: false })
);

router.get('/discord/callback',
  passport.authenticate('discord', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=discord_auth_failed` }),
  handleOAuthCallback
);


module.exports = router;
