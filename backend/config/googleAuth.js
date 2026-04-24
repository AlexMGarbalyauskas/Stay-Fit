/**
 * passport/google.js
 *
 * PURPOSE:
 * Configure Google OAuth login using Passport.js.
 * Authenticates users via Google
 * Checks if user exists in DB
 * Returns existing user OR flags as new user (without auto-creating)
 */


// IMPORTS
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const db = require('../db');



/**
 * GOOGLE Strategy config
 */
passport.use(
  new GoogleStrategy(
    // Google OAuth credentials and callback URL
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },




       /**
     * VERIFY CALLBACK
     * Runs after Google authenticates the user
     */
    async (accessToken, refreshToken, profile, done) => {
  

      // Extract email and username from Google profile
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName;



        // Log the received profile info for debugging
        console.log('Google strategy profile received:', {
          email,
          username,
          profileId: profile.id,
        });



        /**
         * timeout protection for DB query
         * Prevents hanging if DB is slow/unresponsive
         */
        let finished = false;

        const timeoutId = setTimeout(() => {
          if (finished) return;
          finished = true;

          console.error('Google strategy timeout while querying DB for user:', { email });
          done(new Error('Google authentication timed out while loading user record'));
        }, 15000);



        /**
         * check if user with this email already exists in DB
         */
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeoutId);

          if (err) {
            console.error('Google strategy DB error:', err);
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
        console.error('Google strategy unexpected error:', err);
        done(err);
      }
    }
  )
);

module.exports = passport;
