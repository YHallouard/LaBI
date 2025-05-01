// This script will reset the database by deleting it from the SQLite storage
// Run with: expo run:ios or expo run:android

import * as FileSystem from 'expo-file-system';

console.log('Starting database reset script...');

// Function to reset the database
async function resetDatabase() {
  const dbName = 'biological_analyses.db';
  const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${dbDirectory}/${dbName}`;
  
  console.log('Checking if database exists at path:', dbPath);
  
  try {
    // Check if the directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
    if (dirInfo.exists) {
      console.log('SQLite directory exists, checking for database file...');
      
      // Check if the db file exists
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (fileInfo.exists) {
        console.log('Database file exists, deleting it...');
        await FileSystem.deleteAsync(dbPath);
        console.log('Database file deleted successfully!');
      } else {
        console.log('Database file does not exist.');
      }
    } else {
      console.log('SQLite directory does not exist. No database to reset.');
    }
    
    console.log('Database reset complete. App will create a new database on next startup.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Execute the reset function
resetDatabase()
  .then(() => console.log('Database reset script completed'))
  .catch(err => console.error('Error in reset script:', err));

export default resetDatabase; 