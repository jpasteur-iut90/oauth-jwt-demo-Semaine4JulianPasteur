const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const {
  findUserByProvider,
  upsertProviderUser
} = require('../models/User');



const processStrategy = async (req, provider, profile, done) => {
  try {
    const db = req.app.locals.db;

    let profileData = {
      id: profile.id,
      name: profile.displayName || profile.username,
      email: profile.emails?.[0]?.value,
      picture: profile.photos?.[0]?.value
    };

    if (provider === 'discord') {
      profileData.name = profile.global_name || profile.username;
      profileData.email = profile.email;
      if (profile.avatar) {
        profileData.picture = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
      }
    }

    let user = await findUserByProvider(db, provider, profile.id);

    if (!user) {
      user = await upsertProviderUser(db, provider, profileData);
    }

    return done(null, user);
  } catch (error) {
    console.error(`Passport ${provider} Error:`, error);
    return done(error, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true
    },
    (req, token, refresh, profile, done) => processStrategy(req, 'google', profile, done)
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
    (req, token, refresh, profile, done) => processStrategy(req, 'github', profile, done)
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
    (req, token, refresh, profile, done) => processStrategy(req, 'discord', profile, done)
  )
);




module.exports = passport;
