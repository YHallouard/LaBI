import * as SQLite from 'expo-sqlite';

export type Database = SQLite.SQLiteDatabase;

// Create a singleton instance to ensure we only have one database connection
let dbInstance: Database | null = null;

export const initializeDatabase = (): Database => {
  console.log('Initializing database...');
  
  if (dbInstance) {
    console.log('Returning existing database instance');
    return dbInstance;
  }
  
  try {
    // Open database
    const db = SQLite.openDatabaseSync('biological_analyses.db');
    console.log('Database opened successfully');
    
    // Make sure table exists
    try {
      // Create the table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS biological_analyses (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          pdf_source TEXT,
          lab_values TEXT
        )
      `);
      console.log('Table creation SQL executed');
      
      // Verify table exists by querying it
      const tables = db.getAllSync('SELECT name FROM sqlite_master WHERE type="table" AND name="biological_analyses"');
      console.log('Tables found:', JSON.stringify(tables));
      
      if (tables.length === 0) {
        throw new Error('Table was not created successfully');
      }
      
      console.log('Database table created/verified successfully');
      
      // Store the instance and return it
      dbInstance = db;
      return db;
    } catch (tableError) {
      console.error('Error creating or verifying table:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = (): Database => {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
};
