const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const {
  findUserByGoogleId,
  createUserFromGoogle,
  findUserByGithubId,
  createUserFromGithub,
  findUserByDiscordId,
  createUserFromDiscord
} = require('../models/User');

// =============================================================================
// TODO 1: Configuration de la stratégie Google OAuth 2.0
// =============================================================================
// Instructions:
// 1. Importer GoogleStrategy depuis 'passport-google-oauth20'
// 2. Configurer passport.use() avec new GoogleStrategy()
// 3. Options à passer :
//    - clientID: process.env.GOOGLE_CLIENT_ID
//    - clientSecret: process.env.GOOGLE_CLIENT_SECRET
//    - callbackURL: process.env.GOOGLE_CALLBACK_URL
//    - passReqToCallback: true (pour accéder à req.app.locals.db)
// 4. Fonction callback async (req, accessToken, refreshToken, profile, done) :
//    a. Récupérer db depuis req.app.locals.db
//    b. Chercher l'utilisateur par googleId (profile.id) avec findUserByGoogleId()
//    c. Si l'utilisateur n'existe pas, le créer avec createUserFromGoogle()
//       - googleId: profile.id
//       - email: profile.emails[0].value
//       - name: profile.displayName
//       - picture: profile.photos[0].value
//    d. Appeler done(null, user) pour retourner l'utilisateur
//    e. En cas d'erreur, appeler done(error, null)
//
// Documentation : https://www.passportjs.org/packages/passport-google-oauth20/
// =============================================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = req.app.locals.db;
        let user = await findUserByGoogleId(db, profile.id);

        if (!user) {
          user = await createUserFromGoogle(db, {
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = req.app.locals.db;
        let user = await findUserByGithubId(db, profile.id);

        if (!user) {
          user = await createUserFromGithub(db, {
            githubId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName || profile.username,
            picture: profile.photos?.[0]?.value
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = req.app.locals.db;
        let user = await findUserByDiscordId(db, profile.id);

        if (!user) {
          const avatar = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null;

          user = await createUserFromDiscord(db, {
            discordId: profile.id,
            email: profile.email,
            name: profile.global_name || profile.username,
            picture: avatar
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


// ⚠️ PAS de serializeUser/deserializeUser car on utilise JWT (stateless)
// Ces fonctions sont uniquement pour les sessions

module.exports = passport;
