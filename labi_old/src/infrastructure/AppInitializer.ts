import { initializeDatabase, getDatabaseStorage } from './database/DatabaseInitializer';

// Simple flag to track initialization
let isInitialized = false;

/**
 * Initialize the application components
 * This handles secure database setup with encryption
 */
export const initializeApp = async (): Promise<void> => {
  // If already initialized, return immediately
  if (isInitialized) {
    return Promise.resolve();
  }
  
  try {
    console.log('Starting app initialization...');
    
    // Check if database is already initialized from index.ts
    try {
      await getDatabaseStorage();
      console.log('Database already initialized from index.ts');
    } catch (dbError) {
      // Only initialize if not already done
      console.log('Database not initialized yet, initializing now');
      await initializeDatabase();
    }
    
    // Mark as initialized
    isInitialized = true;
    console.log('App initialization complete.');
  } catch (error) {
    console.error('Error initializing app:', error);
    throw error;
  }
}; 