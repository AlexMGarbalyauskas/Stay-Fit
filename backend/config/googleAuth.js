const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

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

        db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
          if (err) return done(err);
          if (user) return done(null, user);

          // Create new user
          const dummyPassword = 'google_' + Date.now();
          const passwordHash = await bcrypt.hash(dummyPassword, 10);

          const stmt = db.prepare(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
          );
          stmt.run(username, email, passwordHash, function(err) {
            if (err) return done(err);
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newUser) => {
              return done(err, newUser);
            });
          });
          stmt.finalize();
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
