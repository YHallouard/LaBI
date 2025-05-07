import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";

export type Database = SQLite.SQLiteDatabase;

/**
 * Implementation of the DatabaseStoragePort using SQLite and Expo FileSystem
 * This adapter handles both initialization and deletion operations
 */
export class SQLiteDatabaseStorage implements DatabaseStoragePort {
  private readonly dbName: string;
  private readonly dbDirectory: string;
  private readonly dbPath: string;
  private dbInstance: Database | null = null;

  constructor(dbName: string = "biological_analyses.db") {
    this.dbName = dbName;
    this.dbDirectory = `${FileSystem.documentDirectory}SQLite`;
    this.dbPath = `${this.dbDirectory}/${this.dbName}`;
  }

  /**
   * Initializes the database and creates required tables
   */
  async initializeDatabase(): Promise<Database> {
    console.log("Initializing database...");

    if (this.dbInstance) {
      console.log("Returning existing database instance");
      return this.dbInstance;
    }

    try {
      // Open database
      const db = SQLite.openDatabaseSync(this.dbName);
      console.log("Database opened successfully");

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
        console.log("Table creation SQL executed");

        // Verify table exists by querying it
        const tables = db.getAllSync(
          'SELECT name FROM sqlite_master WHERE type="table" AND name="biological_analyses"'
        );
        console.log("Tables found:", JSON.stringify(tables));

        if (tables.length === 0) {
          throw new Error("Table was not created successfully");
        }

        console.log("Database table created/verified successfully");

        // Store the instance and return it
        this.dbInstance = db;
        return db;
      } catch (tableError) {
        console.error("Error creating or verifying table:", tableError);
        throw tableError;
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  /**
   * Gets the existing database instance or initializes a new one
   */
  async getDatabase(): Promise<Database> {
    if (!this.dbInstance) {
      return this.initializeDatabase();
    }
    return this.dbInstance;
  }

  /**
   * Checks if the database file exists
   */
  async databaseExists(): Promise<boolean> {
    const dirInfo = await FileSystem.getInfoAsync(this.dbDirectory);
    if (!dirInfo.exists) {
      return false;
    }

    const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
    return fileInfo.exists;
  }

  /**
   * Deletes the database file if it exists
   */
  async deleteDatabase(): Promise<void> {
    const exists = await this.databaseExists();
    if (exists) {
      // Clear the instance before deleting the file
      this.dbInstance = null;

      await FileSystem.deleteAsync(this.dbPath);
      console.log(`Database file ${this.dbPath} deleted successfully!`);
    } else {
      console.log(`Database file ${this.dbPath} does not exist.`);
    }
  }

  /**
   * Resets the database by deleting and then re-initializing it
   */
  async resetDatabase(): Promise<Database> {
    console.log("Resetting database...");

    // Delete the database if it exists
    await this.deleteDatabase();

    // Initialize a new database
    return this.initializeDatabase();
  }
}
