const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_FILE);

// Read and execute migrations
const migrations = ['add_privacy_setting.sql', 'add_timezone.sql', 'add_notifications_enabled.sql', 'add_workout_schedules.sql'];

migrations.forEach((migrationFile) => {
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql, (err) => {
      if (err) {
        // Ignore errors if column already exists
        if (!err.message.includes('duplicate column name')) {
          console.error(`Migration ${migrationFile} failed:`, err);
        }
      } else {
        console.log(`✅ Migration completed: ${migrationFile}`);
      }
    });
  }
});

setTimeout(() => {
  db.close();
  console.log('✅ All migrations completed');
}, 1000);
