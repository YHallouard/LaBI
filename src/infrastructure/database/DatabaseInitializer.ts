import * as SQLite from 'expo-sqlite';

export type Database = SQLite.SQLiteDatabase;

export const initializeDatabase = (): Database => {
  const db = SQLite.openDatabase('biological_analyses.db');
  
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS biological_analyses (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        crp_value REAL NOT NULL,
        pdf_source TEXT
      )`,
      [],
      () => {
        console.log('Database initialized successfully');
      },
      (_, error) => {
        console.error('Error initializing database:', error);
        return false;
      }
    );
  });
  
  return db;
};

export const getDatabase = (): Database => {
  return SQLite.openDatabase('biological_analyses.db');
}; 