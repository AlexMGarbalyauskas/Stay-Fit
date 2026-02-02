const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const db = require('../db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
          if (err) return done(err);
          if (user) {
            // User exists, return them with isNewUser flag = false
            user.isNewUser = false;
            return done(null, user);
          }

          // This is a new user trying to login - don't auto-create
          // Return user object with isNewUser flag = true but don't save to DB
          const newUserData = {
            email,
            username,
            isNewUser: true,
          };
          return done(null, newUserData);
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

module.exports = passport;
