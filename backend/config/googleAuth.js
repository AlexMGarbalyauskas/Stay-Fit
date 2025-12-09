const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const db = require("../db");

// Google OAuth
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

        db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
          if (err) return done(err);
          if (row) return done(null, row);

          // dummy password hash
          const dummyPassword = 'google_' + Date.now();
          const passwordHash = await bcrypt.hash(dummyPassword, 10);

          const stmt = db.prepare(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
          );
          stmt.run(username, email, passwordHash, function (err) {
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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => done(err, user));
});

module.exports = passport;
