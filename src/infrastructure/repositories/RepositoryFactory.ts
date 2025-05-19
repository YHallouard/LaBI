import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { SQLiteBiologicalAnalysisRepository } from "../../adapters/repositories/SQLiteBiologicalAnalysisRepository";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { SQLiteUserProfileRepository } from "../../adapters/repositories/SQLiteUserProfileRepository";
import { getDatabaseStorage } from "../database/DatabaseInitializer";

// Singleton repository instances
let biologicalAnalysisRepositoryInstance: BiologicalAnalysisRepository | null = null;
let userProfileRepositoryInstance: UserProfileRepository | null = null;

/**
 * Factory for creating and accessing repositories with database connections
 */
export class RepositoryFactory {
  /**
   * Get a BiologicalAnalysisRepository instance with database encryption
   */
  static async getBiologicalAnalysisRepository(): Promise<BiologicalAnalysisRepository> {
    if (!biologicalAnalysisRepositoryInstance) {
      try {
        // Get database storage with encryption
        const dbStorage = await getDatabaseStorage();
        biologicalAnalysisRepositoryInstance = new SQLiteBiologicalAnalysisRepository(dbStorage);
        console.log('BiologicalAnalysisRepository created with encrypted database');
      } catch (error) {
        console.error('Error creating BiologicalAnalysisRepository:', error);
        throw error;
      }
    }
    
    return biologicalAnalysisRepositoryInstance;
  }

  static async getUserProfileRepository(): Promise<UserProfileRepository> {
    if (!userProfileRepositoryInstance) {
      try {
        // Get database storage with encryption
        const dbStorage = await getDatabaseStorage();
        userProfileRepositoryInstance = new SQLiteUserProfileRepository(dbStorage);
        console.log('UserProfileRepository created with encrypted database');
      } catch (error) {
        console.error('Error creating UserProfileRepository:', error);
        throw error;
      }
    }
    
    return userProfileRepositoryInstance;
  }
} 