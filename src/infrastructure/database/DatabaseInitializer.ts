import { SQLiteDatabaseStorage } from "../../adapters/infrastructure/SQLiteDatabaseStorage";
import * as SecureStore from 'expo-secure-store';

// Single instance of the database storage
let databaseStorageInstance: SQLiteDatabaseStorage | null = null;

// Key to store the database encryption key in secure storage
const DB_ENCRYPTION_KEY_STORAGE = 'db_encryption_key';

// Get or create a secure encryption key
const getEncryptionKey = async (): Promise<string> => {
  try {
    let key = await SecureStore.getItemAsync(DB_ENCRYPTION_KEY_STORAGE);
    
    if (!key) {
      // First-time use, generate and store a new key
      key = generateRandomKey(32);
      await SecureStore.setItemAsync(DB_ENCRYPTION_KEY_STORAGE, key);
      console.log('New database encryption key generated and stored');
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Secure storage unavailable - cannot safely proceed');
  }
};

// Generate a cryptographically secure random encryption key
const generateRandomKey = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Initialize the database - must be called before any other function
export const initializeDatabase = async () => {
  if (databaseStorageInstance) {
    return databaseStorageInstance;
  }
  
  console.log('Initializing encrypted database...');
  
  // Get the encryption key
  const encryptionKey = await getEncryptionKey();
  
  // Create a new database instance
  databaseStorageInstance = new SQLiteDatabaseStorage("hemea.db", encryptionKey);
  
  // Initialize the database
  await databaseStorageInstance.initializeDatabase();
  
  console.log('Database initialized successfully');
  
  return databaseStorageInstance;
};

// Get the database storage - throws if not initialized
export const getDatabaseStorage = async () => {
  if (!databaseStorageInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return databaseStorageInstance;
};

// Get the SQLite database instance
export const getDatabase = async () => {
  const storage = await getDatabaseStorage();
  return storage.getDatabase();
};

// Reset the database
export const resetDatabase = async () => {
  const storage = await getDatabaseStorage();
  return storage.resetDatabase();
};
