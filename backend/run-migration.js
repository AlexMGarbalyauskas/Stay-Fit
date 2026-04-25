//run-migration.js used to run SQL migrations for 
// adding new columns to the database without losing 
// existing data. It checks if the columns already exist
//  before attempting to add them, allowing for safe upgrades 
// without data loss. This is a simple way to manage database 
// schema changes in a SQLite database used by the application.

//const sqlite3 for database operations, path and fs for file handling
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_FILE);

// Read and execute migrations
const migrations = ['add_privacy_setting.sql', 'add_timezone.sql', 'add_notifications_enabled.sql', 'add_workout_schedules.sql'];

// Loop through each migration file, read its SQL content,
//  and execute it against the database
migrations.forEach((migrationFile) => {
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  if (fs.existsSync(migrationPath)) {

    // Read the SQL commands from the migration file
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL commands to perform the migration
    db.exec(migrationSql, (err) => {

      if (err) {

        // Ignore errors if column already exists
        if (!err.message.includes('duplicate column name')) {
          console.error(`Migration ${migrationFile} failed:`, err);
        }
        
      } else {
        console.log(`Migration completed: ${migrationFile}`);
      }
    });
  }
});


// After running all migrations, close the database connection
setTimeout(() => {
  db.close();

  // Log completion message after all migrations have been attempted
  console.log('All migrations completed');
}, 1000);
