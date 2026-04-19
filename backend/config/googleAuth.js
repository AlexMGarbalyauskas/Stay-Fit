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

        console.log('🔐 Google strategy profile received:', {
          email,
          username,
          profileId: profile.id,
        });

        let finished = false;
        const timeoutId = setTimeout(() => {
          if (finished) return;
          finished = true;
          console.error('❌ Google strategy timeout while querying DB for user:', { email });
          done(new Error('Google authentication timed out while loading user record'));
        }, 15000);

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);

          if (err) {
            console.error('❌ Google strategy DB error:', err);
            return done(err);
          }

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
        console.error('❌ Google strategy unexpected error:', err);
        done(err);
      }
    }
  )
);

module.exports = passport;
