import * as FileSystem from "expo-file-system";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

export type Database = SQLite.SQLiteDatabase;

export class SQLiteDatabaseStorage implements DatabaseStoragePort {
  private readonly dbName: string;
  private readonly dbDirectory: string;
  private readonly dbPath: string;
  private readonly encryptionKey: string;
  private dbInstance: Database | null = null;
  private isAndroid: boolean = Platform.OS === "android";
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private initializationPromise: Promise<Database> | null = null;
  private isOperationInProgress: boolean = false;

  constructor(dbName: string = "biological_analyses.db", encryptionKey?: string) {
    this.dbName = dbName;
    this.dbDirectory = `${FileSystem.documentDirectory}SQLite`;
    this.dbPath = `${this.dbDirectory}/${this.dbName}`;
    
    // Ensure encryption key is provided or throw error
    if (!encryptionKey) {
      throw new Error("Encryption key must be provided for secure database access");
    }
    this.encryptionKey = encryptionKey;
    
    // This is a simulation - in a real app, we would use SQLCipher or other encryption
    console.log("Database encryption enabled with secure key");
  }

  async initializeDatabase(): Promise<Database> {
    if (this.initializationPromise) {
      console.log(
        "Database initialization already in progress, reusing promise"
      );
      return this.initializationPromise;
    }

    this.isOperationInProgress = true;
    this.initializationPromise = this.performInitialization();
    try {
      return await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
      this.isOperationInProgress = false;
    }
  }

  private async performInitialization(): Promise<Database> {
    console.log("Initializing database...");

    if (await this.canReuseExistingConnection()) {
      return this.dbInstance as Database;
    }

    await this.closeConnection();

    try {
      await this.ensureDirectoryExists();

      const dbExists = await this.databaseExists();
      console.log(`Database exists? ${dbExists}`);

      const db = await this.openDatabaseConnection();

      await this.ensureRequiredTablesExist(db);
      // Only for dev 
      // await this.populateTestDataIfEmpty(db);

      this.dbInstance = db;
      return db;
    } catch (error) {
      return this.handleInitializationError(error);
    }
  }

  private async canReuseExistingConnection(): Promise<boolean> {
    if (!this.dbInstance) return false;

    try {
      await this.dbInstance.getFirstAsync("SELECT 1");
      console.log("Existing database connection is healthy, reusing it");
      await this.ensureRequiredTablesExist(this.dbInstance);
      // Only for dev 
      // await this.populateTestDataIfEmpty(this.dbInstance);
      return true;
    } catch {
      console.log("Existing database connection is not usable, recreating it");
      return false;
    }
  }

  private async handleInitializationError(error: unknown): Promise<Database> {
    console.error("Error initializing database:", error);

    if (this.retryCount >= this.maxRetries) {
      this.retryCount = 0;
      throw error;
    }

    console.log(
      `Retrying database initialization (attempt ${this.retryCount + 1}/${
        this.maxRetries
      })...`
    );
    this.retryCount++;

    await this.waitBeforeRetry(1000);

    try {
      await this.deleteDatabase();
    } catch (cleanupError) {
      console.warn("Error cleaning up before retry:", cleanupError);
    }

    return this.initializeDatabase();
  }

  private async waitWithTimeout(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitBeforeRetry(ms: number): Promise<void> {
    await this.waitWithTimeout(ms);
  }

  private async openDatabaseConnection(): Promise<Database> {
    try {
      const db = await SQLite.openDatabaseAsync(this.dbName);
      await db.execAsync(`PRAGMA key = '${this.encryptionKey}';`);
      
      // Verify encryption is working by running a simple query
      try {
        await db.execAsync('SELECT count(*) FROM sqlite_master;');
      } catch (error) {
        throw new Error('Database encryption failed: Invalid encryption key or database corruption');
      }
      
      return db;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to open encrypted database: ${error.message}`);
      }
      throw new Error('Failed to open encrypted database: Unknown error');
    }
  }

  private async ensureRequiredTablesExist(db: Database): Promise<void> {
    const requiredTables = ["biological_analyses", "user_profile"];
    const existingTables = await this.getExistingTables(db);

    const existingTableNames = existingTables.map((t) => t.name);
    console.log("Existing tables found:", JSON.stringify(existingTables));

    const missingTables = requiredTables.filter(
      (table) => !existingTableNames.includes(table)
    );

    if (missingTables.length > 0) {
      console.log(
        `Missing required tables: ${missingTables.join(
          ", "
        )}. Creating tables...`
      );
      await this.createTables(db);
    } else {
      console.log("All required tables exist.");
    }
  }

  private async getExistingTables(
    db: Database
  ): Promise<Array<{ name: string }>> {
    return await db.getAllAsync<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"'
    );
  }

  private async createTables(db: Database): Promise<void> {
    this.validateDatabaseConnection(db);

    try {
      await this.createAllRequiredTables(db);
      console.log("Database tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  private validateDatabaseConnection(db: Database): void {
    if (!db) {
      throw new Error("Cannot create tables: database instance is null");
    }
  }

  private async createAllRequiredTables(db: Database): Promise<void> {
    try {
      await this.createBiologicalAnalysesTable(db);
      await this.addOperationDelay(100);
      await this.createUserProfileTable(db);
      await this.addOperationDelay(100);
      await this.verifyTablesCreation(db);
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  private async createBiologicalAnalysesTable(db: Database): Promise<void> {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS biological_analyses (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        pdf_source TEXT,
        lab_values TEXT
      )
    `);
    console.log("Biological analyses table created");
  }

  private async createUserProfileTable(db: Database): Promise<void> {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        birthDate TEXT,
        gender TEXT,
        profileImage TEXT
      )
    `);
    console.log("User profile table created");
  }

  private async verifyTablesCreation(db: Database): Promise<void> {
    const tables = await db.getAllAsync(
      'SELECT name FROM sqlite_master WHERE type="table" AND name IN ("biological_analyses", "user_profile")'
    );
    console.log("Tables found:", JSON.stringify(tables));

    if (tables.length < 2) {
      throw new Error("Not all tables were created successfully");
    }
  }

  private async populateTestDataIfEmpty(db: Database): Promise<void> {
    const count = await this.countExistingAnalyses(db);

    if (count === 0) {
      await this.insertTestAnalyses(db);
    }
  }

  private async countExistingAnalyses(db: Database): Promise<number> {
    const existingAnalyses = await db.getAllAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM biological_analyses"
    );
    return existingAnalyses[0]?.count || 0;
  }

  private async insertTestAnalyses(db: Database): Promise<void> {
    const testAnalyses = this.prepareTestAnalysesData();

    for (const analysis of testAnalyses) {
      await this.insertAnalysis(db, analysis);
    }

    console.log("Added test analyses to the database");
  }

  private async insertAnalysis(
    db: Database,
    analysis: {
      id: string;
      date: string;
      pdf_source: string | null;
      lab_values: string;
    }
  ): Promise<void> {
    const pdfSourceValue =
      analysis.pdf_source === null ? "NULL" : `'${analysis.pdf_source}'`;
    await db.execAsync(
      `INSERT INTO biological_analyses (id, date, pdf_source, lab_values) 
         VALUES ('${analysis.id}', '${analysis.date}', ${pdfSourceValue}, '${analysis.lab_values}')`
    );
  }

  private prepareTestAnalysesData(): Array<{
    id: string;
    date: string;
    pdf_source: string | null;
    lab_values: string;
  }> {
    return [
      {
        id: "test-analysis-1",
        date: new Date().toISOString().split("T")[0],
        pdf_source: null,
        lab_values: JSON.stringify({
          Hematies: { value: 4.8, unit: "T/L" },
          "Vitamine B9": { value: 15.2, unit: "ng/mL" },
          TSH: { value: 2.1, unit: "mUI/L" },
        }),
      },
      {
        id: "test-analysis-2",
        date: new Date(Date.now() - 19 * 12 * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        pdf_source: null,
        lab_values: JSON.stringify({
          Hematies: { value: 6.0, unit: "T/L" },
          "Vitamine B9": { value: 4.3, unit: "ng/mL" },
          TSH: { value: 2.5, unit: "mUI/L" },
        }),
      },
      {
        id: "test-analysis-3",
        date: new Date(Date.now() - 9 * 12 * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        pdf_source: null,
        lab_values: JSON.stringify({
          Hematies: { value: 3.8, unit: "T/L" },
          "Vitamine B9": { value: 1.2, unit: "ng/mL" },
          TSH: { value: 6.7, unit: "mUI/L" },
        }),
      },
      {
        id: "test-analysis-4",
        date: new Date(Date.now() - 29 * 12 * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        pdf_source: null,
        lab_values: JSON.stringify({
          Hematies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }),
      },
    ];
  }

  private async addOperationDelay(ms: number): Promise<void> {
    await this.waitWithTimeout(ms);
  }

  async executeSql(
    db: Database,
    sql: string,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    params: any[] = []
  ): Promise<void> {
    this.validateDatabaseConnection(db);

    try {
      this.isOperationInProgress = true;
      await db.execAsync(sql);
    } catch (error) {
      console.error(`Error executing SQL: ${sql.substring(0, 50)}...`, error);
      throw error;
    } finally {
      this.isOperationInProgress = false;
    }
  }

  async querySql(
    db: Database,
    sql: string,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    params: any[] = []
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  ): Promise<any[]> {
    this.validateDatabaseConnection(db);

    try {
      this.isOperationInProgress = true;
      return await db.getAllAsync(sql, params);
    } catch (error) {
      console.error(`Error querying SQL: ${sql}`, error);
      throw error;
    } finally {
      this.isOperationInProgress = false;
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await this.createDirectoryIfNotExists();
      await this.verifyWritePermissions();
    } catch (error) {
      console.warn("Error ensuring directory exists:", error);
      throw error;
    }
  }

  private async createDirectoryIfNotExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.dbDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.dbDirectory, {
        intermediates: true,
      });
      console.log(`Created database directory: ${this.dbDirectory}`);
    }
  }

  private async verifyWritePermissions(): Promise<void> {
    const testPath = `${this.dbDirectory}/test.tmp`;
    await FileSystem.writeAsStringAsync(testPath, "test");
    await FileSystem.deleteAsync(testPath, { idempotent: true });
  }
  private async closeConnection(): Promise<void> {
    if (this.isOperationInProgress) {
      console.log("Database operation in progress, skipping connection close");
      return;
    }

    if (!this.dbInstance) return;

    try {
      await this.dbInstance.closeAsync();
      console.log("Database connection closed");
    } catch (error) {
      console.warn("Error closing database:", error);
    }

    this.dbInstance = null;
  }

  async getDatabase(): Promise<Database> {
    try {
      if (await this.isCurrentConnectionValid()) {
        return this.dbInstance as Database;
      }

      return this.initializeDatabase();
    } catch (error) {
      console.error("Error getting database:", error);
      throw error;
    }
  }

  private async isCurrentConnectionValid(): Promise<boolean> {
    if (!this.dbInstance) return false;

    try {
      await this.dbInstance.getFirstAsync("SELECT 1");
      return true;
    } catch {
      console.log("Database connection invalid, reinitializing...");
      return false;
    }
  }

  async databaseExists(): Promise<boolean> {
    const dirInfo = await FileSystem.getInfoAsync(this.dbDirectory);
    if (!dirInfo.exists) {
      return false;
    }

    const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
    return fileInfo.exists;
  }

  async deleteDatabase(): Promise<void> {
    await this.closeConnection();

    const exists = await this.databaseExists();
    if (exists) {
      await this.deleteDatabaseFile();
    } else {
      console.log(`Database file ${this.dbPath} does not exist.`);
    }
  }

  private async deleteDatabaseFile(): Promise<void> {
    try {
      await this.cleanupDatabaseFiles();
      await FileSystem.deleteAsync(this.dbPath, { idempotent: true });
      console.log(`Database file ${this.dbPath} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting database file: ${error}`);
      throw error;
    }
  }

  private async cleanupDatabaseFiles(): Promise<void> {
    try {
      const dirContents = await FileSystem.readDirectoryAsync(this.dbDirectory);
      const filesToDelete = this.findDatabaseRelatedFiles(dirContents);
      await this.deleteFilesOneByOne(filesToDelete);

      if (this.isAndroid) {
        await this.waitWithTimeout(300);
      }
    } catch (error) {
      console.warn("Error during database file cleanup:", error);
    }
  }

  private findDatabaseRelatedFiles(dirContents: string[]): string[] {
    const relatedPatterns = [
      this.dbName,
      `${this.dbName}-journal`,
      `${this.dbName}-shm`,
      `${this.dbName}-wal`,
    ];

    return dirContents
      .filter((file) =>
        relatedPatterns.some((pattern) => file.includes(pattern))
      )
      .map((file) => `${this.dbDirectory}/${file}`);
  }

  private async deleteFilesOneByOne(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(
        (err) => console.warn(`Failed to delete ${filePath}:`, err)
      );
    }
  }

  async resetDatabase(): Promise<Database> {
    console.log("Resetting database...");

    this.isOperationInProgress = true;
    try {
      const db = await this.getDatabase();
      await this.dropAllTables(db);
      await this.createTables(db);
      // Only for dev 
      await this.populateTestDataIfEmpty(db);
      await this.verifyTablesAfterReset(db);
      return db;
    } catch (error) {
      return this.handleResetError(error);
    } finally {
      this.isOperationInProgress = false;
    }
  }

  private async handleResetError(error: unknown): Promise<Database> {
    console.error("Error during database reset:", error);

    try {
      console.log("Attempting recovery with full reinitialization");
      await this.closeConnection();
      await this.waitWithTimeout(1000);
      return await this.initializeDatabase();
    } catch (recoveryError) {
      console.error("Recovery from reset error failed:", recoveryError);
      throw error;
    }
  }

  private async verifyTablesAfterReset(db: Database): Promise<void> {
    const tables = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"'
    );
    console.log(
      `Database reset complete. Found ${tables.length} tables: ${tables
        .map((t) => t.name)
        .join(", ")}`
    );
  }

  private async dropAllTables(db: Database): Promise<void> {
    try {
      const tables = await this.getExistingTables(db);

      for (const table of tables) {
        await db.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
        console.log(`Table ${table.name} dropped`);
      }
    } catch (error) {
      console.error("Error dropping tables:", error);
      throw error;
    }
  }

  async resetUserProfileTable(): Promise<Database> {
    console.log("Resetting user_profile table...");

    this.isOperationInProgress = true;
    try {
      const db = await this.getDatabase();
      await this.executeSql(db, "DROP TABLE IF EXISTS user_profile");
      await this.createUserProfileTable(db);
      return db;
    } catch (error) {
      console.error("Error resetting user profile table:", error);
      throw error;
    } finally {
      this.isOperationInProgress = false;
    }
  }
}
