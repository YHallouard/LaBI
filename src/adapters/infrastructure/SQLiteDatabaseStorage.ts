import * as FileSystem from "expo-file-system";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";
import { LabValue } from "../../domain/entities/BiologicalAnalysis";

export type Database = SQLite.SQLiteDatabase;

export class SQLiteDatabaseStorage implements DatabaseStoragePort {
  private readonly dbName: string;
  private readonly dbDirectory: string;
  private readonly dbPath: string;
  private readonly encryptionKey: string;
  private dbInstance: Database | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private initializationPromise: Promise<Database> | null = null;
  private isOperationInProgress: boolean = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private lastConnectionCheck: number = 0;
  private readonly connectionCheckThreshold: number = 5000;

  constructor(dbName: string, encryptionKey?: string) {
    this.dbName = dbName;
    this.dbDirectory = `${FileSystem.documentDirectory}SQLite`;
    this.dbPath = `${this.dbDirectory}/${this.dbName}`;

    this.validateEncryptionKeyExists(encryptionKey);
    this.encryptionKey = encryptionKey!;
    this.startPeriodicConnectionHealthChecks();
  }

  private validateEncryptionKeyExists(encryptionKey?: string): void {
    if (!encryptionKey) {
      const errorMessage =
        "Encryption key must be provided for secure database access";
      Alert.alert("Database Error", errorMessage);
      throw new Error(errorMessage);
    }
  }

  private startPeriodicConnectionHealthChecks(): void {
    this.clearExistingHealthCheckInterval();
    this.schedulePeriodicHealthChecks();
  }

  private clearExistingHealthCheckInterval(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  private schedulePeriodicHealthChecks(): void {
    this.connectionCheckInterval = setInterval(async () => {
      if (this.shouldPerformHealthCheck()) {
        await this.performScheduledHealthCheck();
      }
    }, 10000);
  }

  private shouldPerformHealthCheck(): boolean {
    return (
      this.dbInstance !== null &&
      !this.isOperationInProgress &&
      this.hasConnectionCheckThresholdPassed()
    );
  }

  private hasConnectionCheckThresholdPassed(): boolean {
    const now = Date.now();
    return now - this.lastConnectionCheck > this.connectionCheckThreshold;
  }

  private async performScheduledHealthCheck(): Promise<void> {
    await this.validateAndRepairConnection();
    this.lastConnectionCheck = Date.now();
  }

  private async validateAndRepairConnection(): Promise<void> {
    try {
      await this.testConnectionWithSimpleQuery();
    } catch (error) {
      console.error("Error validating and repairing connection:", error);
      await this.repairBrokenConnection();
    }
  }

  private async testConnectionWithSimpleQuery(): Promise<void> {
    if (!this.dbInstance) return;
    await this.dbInstance.getFirstAsync("SELECT 1");
  }

  private async repairBrokenConnection(): Promise<void> {
    console.log("Database connection lost, attempting to reconnect...");
    this.dbInstance = null;
    await this.initializeDatabase();
  }

  async initializeDatabase(): Promise<Database> {
    if (this.hasInitializationInProgress()) {
      return this.reuseExistingInitializationPromise();
    }

    return this.startNewInitialization();
  }

  private hasInitializationInProgress(): boolean {
    return this.initializationPromise !== null;
  }

  private async reuseExistingInitializationPromise(): Promise<Database> {
    console.log("Database initialization already in progress, reusing promise");
    return this.initializationPromise!;
  }

  private async startNewInitialization(): Promise<Database> {
    this.markOperationInProgress();
    this.initializationPromise = this.performCompleteInitialization();

    try {
      return await this.initializationPromise;
    } finally {
      this.clearInitializationState();
    }
  }

  private markOperationInProgress(): void {
    this.isOperationInProgress = true;
  }

  private clearInitializationState(): void {
    this.initializationPromise = null;
    this.isOperationInProgress = false;
  }

  private async performCompleteInitialization(): Promise<Database> {
    console.log("Initializing database...");

    if (await this.canReuseExistingHealthyConnection()) {
      return this.dbInstance as Database;
    }

    return this.createFreshDatabaseConnection();
  }

  private async canReuseExistingHealthyConnection(): Promise<boolean> {
    if (!this.dbInstance) return false;

    try {
      await this.testExistingConnectionHealth();
      await this.prepareExistingConnectionForUse();
      return true;
    } catch {
      console.log("Existing database connection is not usable, recreating it");
      return false;
    }
  }

  private async testExistingConnectionHealth(): Promise<void> {
    await this.dbInstance!.getFirstAsync("SELECT 1");
    console.log("Existing database connection is healthy, reusing it");
  }

  private async prepareExistingConnectionForUse(): Promise<void> {
    await this.ensureAllRequiredTablesExist(this.dbInstance!);
    // Only for Dev
    // await this.populateTestDataForDevelopment(this.dbInstance!);
  }

  private async createFreshDatabaseConnection(): Promise<Database> {
    await this.closeExistingConnection();

    try {
      await this.ensureStorageDirectoryExists();
      await this.logDatabaseExistenceStatus();

      const db = await this.openAndConfigureDatabase();
      await this.setupDatabaseStructure(db);

      this.dbInstance = db;
      return db;
    } catch (error) {
      return this.handleDatabaseCreationError(error);
    }
  }

  private async logDatabaseExistenceStatus(): Promise<void> {
    const dbExists = await this.databaseExists();
    console.log(`Database exists? ${dbExists}`);
  }

  private async setupDatabaseStructure(db: Database): Promise<void> {
    await this.ensureAllRequiredTablesExist(db);
    await this.handleMigrations(db);
    if (__DEV__) {
      await this.populateTestDataForDevelopment(db);
    }
  }

  private async handleMigrations(db: Database): Promise<void> {
    const hasPinnedMetrics = await this.columnExists(
      db,
      "user_profile",
      "pinnedMetrics"
    );
    if (!hasPinnedMetrics) {
      console.log("Column 'pinnedMetrics' not found, running migration...");
      try {
        await db.execAsync(
          "ALTER TABLE user_profile ADD COLUMN pinnedMetrics TEXT;"
        );
        console.log("Migration successful: Added 'pinnedMetrics' column.");
      } catch (error) {
        console.error(
          "Failed to run migration to add 'pinnedMetrics' column:",
          error
        );
        throw error;
      }
    }
  }
  private async columnExists(
    db: Database,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const result = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return result.some((col: any) => col.name === columnName);
  }

  private async handleDatabaseCreationError(error: unknown): Promise<Database> {
    console.error("Error initializing database:", error);

    if (this.hasExceededMaxRetries()) {
      this.resetRetryCount();
      this.showDatabaseErrorToUser(error);
      throw error;
    }

    return this.retryDatabaseInitializationAfterCleanup();
  }

  private hasExceededMaxRetries(): boolean {
    return this.retryCount >= this.maxRetries;
  }

  private resetRetryCount(): void {
    this.retryCount = 0;
  }

  private showDatabaseErrorToUser(error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    Alert.alert("Database Error", `Failed to initialize database: ${message}`);
  }

  private async retryDatabaseInitializationAfterCleanup(): Promise<Database> {
    this.logRetryAttempt();
    this.incrementRetryCount();

    await this.waitBeforeRetry();
    await this.cleanupDatabaseBeforeRetry();

    return this.initializeDatabase();
  }

  private logRetryAttempt(): void {
    console.log(
      `Retrying database initialization (attempt ${this.retryCount + 1}/${
        this.maxRetries
      })...`
    );
  }

  private incrementRetryCount(): void {
    this.retryCount++;
  }

  private async waitBeforeRetry(): Promise<void> {
    await this.waitWithTimeout(1000);
  }

  private async cleanupDatabaseBeforeRetry(): Promise<void> {
    try {
      await this.deleteDatabase();
    } catch (cleanupError) {
      console.warn("Error cleaning up before retry:", cleanupError);
    }
  }

  private async waitWithTimeout(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async openAndConfigureDatabase(): Promise<Database> {
    const db = await this.openDatabaseFile();
    await this.setSQLCipherEncryptionKey(db);
    await this.configurePerformancePragmas(db);
    await this.verifyEncryptionIsWorking(db);
    return db;
  }

  private async openDatabaseFile(): Promise<Database> {
    try {
      return await SQLite.openDatabaseAsync(this.dbName);
    } catch (error) {
      this.handleDatabaseOpenError(error);
      throw error;
    }
  }

  private handleDatabaseOpenError(error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown error";
    Alert.alert("Database Error", `Failed to open database: ${message}`);
  }

  private async setSQLCipherEncryptionKey(db: Database): Promise<void> {
    await db.execAsync(`PRAGMA key = '${this.encryptionKey}';`);
  }

  private async configurePerformancePragmas(db: Database): Promise<void> {
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA synchronous = NORMAL;");
    await db.execAsync("PRAGMA temp_store = MEMORY;");
    await db.execAsync("PRAGMA mmap_size = 30000000000;");
  }

  private async verifyEncryptionIsWorking(db: Database): Promise<void> {
    try {
      await db.execAsync("SELECT count(*) FROM sqlite_master;");
    } catch (error) {
      const errorMessage =
        "Database encryption failed: Invalid encryption key or database corruption";
      Alert.alert("Encryption Error", errorMessage);
      console.error("Encryption Error:", error);
      throw new Error(errorMessage);
    }
  }

  private async ensureAllRequiredTablesExist(db: Database): Promise<void> {
    const requiredTableNames = this.getRequiredTableNames();
    const existingTableNames = await this.getExistingTableNames(db);
    const missingTableNames = this.findMissingTableNames(
      requiredTableNames,
      existingTableNames
    );

    this.logExistingTablesFound(existingTableNames);

    if (this.hasMissingTables(missingTableNames)) {
      await this.createMissingTables(db, missingTableNames);
    } else {
      this.logAllRequiredTablesExist();
    }
  }

  private getRequiredTableNames(): string[] {
    return ["biological_analyses", "user_profile"];
  }

  private async getExistingTableNames(db: Database): Promise<string[]> {
    const existingTables = await this.getExistingTablesFromDatabase(db);
    return existingTables.map((t) => t.name);
  }

  private async getExistingTablesFromDatabase(
    db: Database
  ): Promise<Array<{ name: string }>> {
    return await db.getAllAsync<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"'
    );
  }

  private findMissingTableNames(
    required: string[],
    existing: string[]
  ): string[] {
    return required.filter((table) => !existing.includes(table));
  }

  private logExistingTablesFound(existingTableNames: string[]): void {
    console.log("Existing tables found:", JSON.stringify(existingTableNames));
  }

  private hasMissingTables(missingTableNames: string[]): boolean {
    return missingTableNames.length > 0;
  }

  private async createMissingTables(
    db: Database,
    missingTableNames: string[]
  ): Promise<void> {
    this.logMissingTablesFound(missingTableNames);
    await this.createAllRequiredTables(db);
  }

  private logMissingTablesFound(missingTableNames: string[]): void {
    console.log(
      `Missing required tables: ${missingTableNames.join(
        ", "
      )}. Creating tables...`
    );
  }

  private logAllRequiredTablesExist(): void {
    console.log("All required tables exist.");
  }

  private async createAllRequiredTables(db: Database): Promise<void> {
    this.ensureDatabaseConnectionIsValid(db);

    try {
      await this.createBiologicalAnalysesTableWithDelay(db);
      await this.createUserProfileTableWithDelay(db);
      await this.verifyAllTablesWereCreated(db);
      this.logTablesCreatedSuccessfully();
    } catch (error) {
      this.handleTableCreationError(error);
      throw error;
    }
  }

  private ensureDatabaseConnectionIsValid(db: Database): void {
    if (!db) {
      const errorMessage = "Cannot create tables: database instance is null";
      Alert.alert("Database Error", errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async createBiologicalAnalysesTableWithDelay(
    db: Database
  ): Promise<void> {
    await this.createBiologicalAnalysesTable(db);
    await this.waitBetweenTableCreations();
  }

  private async createUserProfileTableWithDelay(db: Database): Promise<void> {
    await this.createUserProfileTable(db);
    await this.waitBetweenTableCreations();
  }

  private async waitBetweenTableCreations(): Promise<void> {
    await this.waitWithTimeout(100);
  }

  private logTablesCreatedSuccessfully(): void {
    console.log("Database tables created successfully");
  }

  private handleTableCreationError(error: unknown): void {
    console.error("Error creating tables:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    Alert.alert(
      "Table Creation Error",
      `Failed to create database tables: ${message}`
    );
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
        profileImage TEXT,
        pinnedMetrics TEXT
      )
    `);
    console.log("User profile table created");
  }

  private async verifyAllTablesWereCreated(db: Database): Promise<void> {
    const createdTables = await this.getCreatedRequiredTables(db);
    this.logCreatedTablesFound(createdTables);
    this.ensureAllRequiredTablesWereCreated(createdTables);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async getCreatedRequiredTables(db: Database): Promise<any[]> {
    return await db.getAllAsync(
      'SELECT name FROM sqlite_master WHERE type="table" AND name IN ("biological_analyses", "user_profile")'
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private logCreatedTablesFound(createdTables: any[]): void {
    console.log("Tables found:", JSON.stringify(createdTables));
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private ensureAllRequiredTablesWereCreated(createdTables: any[]): void {
    if (createdTables.length < 2) {
      const errorMessage = "Not all tables were created successfully";
      Alert.alert("Table Creation Error", errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async populateTestDataForDevelopment(db: Database): Promise<void> {
    const testAnalyses = this.createTestAnalysesData();
    let insertedCount = 0;

    for (const analysis of testAnalyses) {
      const wasInserted = await this.insertTestAnalysisIfNotExists(
        db,
        analysis
      );
      if (wasInserted) {
        insertedCount++;
      }
    }

    this.logInsertedTestAnalysesCount(insertedCount);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async insertTestAnalysisIfNotExists(
    db: Database,
    analysis: any
  ): Promise<boolean> {
    try {
      const analysisExists = await this.checkIfAnalysisExists(db, analysis.id);

      if (!analysisExists) {
        await this.insertSingleAnalysis(db, analysis);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to insert analysis ${analysis.id}:`, error);
      return false;
    }
  }

  private logInsertedTestAnalysesCount(insertedCount: number): void {
    if (insertedCount > 0) {
      console.log(
        `Added ${insertedCount} missing test analyses to the database`
      );
    }
  }

  private async checkIfAnalysisExists(
    db: Database,
    id: string
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM biological_analyses WHERE id = ?",
        [id]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.warn(`Error checking if analysis ${id} exists:`, error);
      return false;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async insertSingleAnalysis(
    db: Database,
    analysis: any
  ): Promise<void> {
    try {
      await db.runAsync(
        `INSERT INTO biological_analyses (id, date, pdf_source, lab_values) 
         VALUES (?, ?, ?, ?)`,
        [analysis.id, analysis.date, analysis.pdf_source, analysis.lab_values]
      );
    } catch (error) {
      this.handleAnalysisInsertionError(error, analysis.id);
    }
  }

  private handleAnalysisInsertionError(
    error: unknown,
    analysisId: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("UNIQUE constraint failed")) {
      console.log(`Analysis ${analysisId} already exists, skipping insertion`);
    } else {
      throw error;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private createTestAnalysesData(): Array<any> {
    return [
      this.createTestAnalysis("test-analysis-1", 0, {
        Hématies: { value: 4.8, unit: "T/L" },
        "Vitamine B9": { value: 15.2, unit: "ng/mL" },
        TSH: { value: 2.1, unit: "mUI/L" },
      }),
      this.createTestAnalysis("test-analysis-16", 30 * 24 * 60 * 60 * 1000, {
        Hématies: { value: 4.8, unit: "T/L" },
        "Vitamine B9": { value: 15.2, unit: "ng/mL" },
        TSH: { value: 2.1, unit: "mUI/L" },
      }),
      this.createTestAnalysis(
        "test-analysis-2",
        19 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 3.8, unit: "T/L" },
          "Vitamine B9": { value: 4.3, unit: "ng/mL" },
          TSH: { value: 2.5, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-3",
        9 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 6.0, unit: "T/L" },
          "Vitamine B9": { value: 1.2, unit: "ng/mL" },
          TSH: { value: 6.7, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-4",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-5",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-6",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-7",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-8",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-9",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-10",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-11",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-12",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-13",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-14",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
      this.createTestAnalysis(
        "test-analysis-15",
        29 * 12 * 30 * 24 * 60 * 60 * 1000,
        {
          Hématies: { value: 5.1, unit: "T/L" },
          "Vitamine B9": { value: 8.7, unit: "ng/mL" },
          TSH: { value: 3.8, unit: "mUI/L" },
        }
      ),
    ];
  }

  private createTestAnalysis(
    id: string,
    pastTimeMs: number,
    labValues: Record<string, LabValue>
  ): Record<string, string | null> {
    return {
      id,
      date: new Date(Date.now() - pastTimeMs).toISOString().split("T")[0],
      pdf_source: null,
      lab_values: JSON.stringify(labValues),
    };
  }

  async executeSql(
    db: Database,
    sql: string,
    params: any[] = []
  ): Promise<void> {
    return this.executeWithRetryMechanism(async () => {
      const validDb = await this.ensureValidDatabaseConnection(db);
      if (params.length > 0) {
        await validDb.runAsync(sql, params);
      } else {
        await validDb.execAsync(sql);
      }
    });
  }

  async querySql(
    db: Database,
    sql: string,
    params: any[] = []
  ): Promise<any[]> {
    return this.executeWithRetryMechanism(async () => {
      const validDb = await this.ensureValidDatabaseConnection(db);
      return await validDb.getAllAsync(sql, params);
    });
  }

  private async executeWithRetryMechanism<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        this.markOperationInProgress();
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (this.isRecoverableError(error)) {
          await this.handleRecoverableError(attempt);
        } else {
          throw error;
        }
      } finally {
        this.markOperationComplete();
      }
    }

    this.handleFinalRetryFailure(lastError);
    throw lastError;
  }

  private isRecoverableError(error: unknown): boolean {
    return (
      error instanceof Error && error.message.includes("NullPointerException")
    );
  }

  private async handleRecoverableError(attempt: number): Promise<void> {
    console.log(
      `Database operation failed (attempt ${attempt + 1}/3), retrying...`
    );
    this.dbInstance = null;
    await this.waitWithExponentialBackoff(attempt);
    await this.initializeDatabase();
  }

  private async waitWithExponentialBackoff(attempt: number): Promise<void> {
    await this.waitWithTimeout(100 * (attempt + 1));
  }

  private markOperationComplete(): void {
    this.isOperationInProgress = false;
  }

  private handleFinalRetryFailure(lastError: Error | null): void {
    const errorMessage = "Database operation failed after retries";
    Alert.alert("Database Error", errorMessage);
    throw lastError || new Error(errorMessage);
  }

  private async ensureValidDatabaseConnection(db: Database): Promise<Database> {
    try {
      await db.getFirstAsync("SELECT 1");
      return db;
    } catch (error) {
      console.log(
        "Provided database instance is invalid, getting fresh instance...",
        error
      );
      return await this.getDatabase();
    }
  }

  private async ensureStorageDirectoryExists(): Promise<void> {
    try {
      await this.createDatabaseDirectoryIfNeeded();
      await this.verifyDirectoryWritePermissions();
    } catch (error) {
      console.warn("Error ensuring directory exists:", error);
      throw error;
    }
  }

  private async createDatabaseDirectoryIfNeeded(): Promise<void> {
    const directoryExists = await this.checkIfDirectoryExists();
    if (!directoryExists) {
      await this.createDatabaseDirectory();
    }
  }

  private async checkIfDirectoryExists(): Promise<boolean> {
    const dirInfo = await FileSystem.getInfoAsync(this.dbDirectory);
    return dirInfo.exists;
  }

  private async createDatabaseDirectory(): Promise<void> {
    await FileSystem.makeDirectoryAsync(this.dbDirectory, {
      intermediates: true,
    });
    console.log(`Created database directory: ${this.dbDirectory}`);
  }

  private async verifyDirectoryWritePermissions(): Promise<void> {
    const testPath = `${this.dbDirectory}/test.tmp`;
    await FileSystem.writeAsStringAsync(testPath, "test");
    await FileSystem.deleteAsync(testPath, { idempotent: true });
  }

  private async closeExistingConnection(): Promise<void> {
    if (this.isOperationInProgress) {
      console.log("Database operation in progress, skipping connection close");
      return;
    }

    this.clearConnectionHealthCheckInterval();
    await this.closeDatabaseInstance();
    this.clearDatabaseInstance();
  }

  private clearConnectionHealthCheckInterval(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private async closeDatabaseInstance(): Promise<void> {
    if (!this.dbInstance) return;

    try {
      await this.dbInstance.closeAsync();
      console.log("Database connection closed");
    } catch (error) {
      console.warn("Error closing database:", error);
    }
  }

  private clearDatabaseInstance(): void {
    this.dbInstance = null;
  }

  async getDatabase(): Promise<Database> {
    try {
      if (await this.hasValidCurrentConnection()) {
        return this.dbInstance!;
      }

      return await this.initializeDatabase();
    } catch (error) {
      console.error("Error getting database:", error);
      throw error;
    }
  }

  private async hasValidCurrentConnection(): Promise<boolean> {
    if (!this.dbInstance) {
      console.log("Database connection invalid or missing, reinitializing...");
      return false;
    }

    return await this.isCurrentConnectionValid();
  }

  private async isCurrentConnectionValid(): Promise<boolean> {
    try {
      await this.dbInstance!.getFirstAsync("SELECT 1");
      this.updateLastConnectionCheckTime();
      return true;
    } catch (error) {
      console.log("Database connection invalid:", error);
      return false;
    }
  }

  private updateLastConnectionCheckTime(): void {
    this.lastConnectionCheck = Date.now();
  }

  async databaseExists(): Promise<boolean> {
    const directoryExists = await this.checkIfDirectoryExists();
    if (!directoryExists) {
      return false;
    }

    return await this.checkIfDatabaseFileExists();
  }

  private async checkIfDatabaseFileExists(): Promise<boolean> {
    const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
    return fileInfo.exists;
  }

  async deleteDatabase(): Promise<void> {
    await this.closeExistingConnection();

    const databaseExists = await this.databaseExists();
    if (databaseExists) {
      await this.deleteDatabaseFileAndRelatedFiles();
    } else {
      this.logDatabaseFileDoesNotExist();
    }
  }

  private logDatabaseFileDoesNotExist(): void {
    console.log(`Database file ${this.dbPath} does not exist.`);
  }

  private async deleteDatabaseFileAndRelatedFiles(): Promise<void> {
    try {
      await this.cleanupAllDatabaseFiles();
      await this.deletePrimaryDatabaseFile();
      this.logDatabaseDeletionSuccess();
    } catch (error) {
      this.handleDatabaseDeletionError(error);
      throw error;
    }
  }

  private async deletePrimaryDatabaseFile(): Promise<void> {
    await FileSystem.deleteAsync(this.dbPath, { idempotent: true });
  }

  private logDatabaseDeletionSuccess(): void {
    console.log(`Database file ${this.dbPath} deleted successfully!`);
  }

  private handleDatabaseDeletionError(error: unknown): void {
    console.error(`Error deleting database file: ${error}`);
  }

  private async cleanupAllDatabaseFiles(): Promise<void> {
    try {
      const directoryContents = await this.readDatabaseDirectory();
      const relatedFiles = this.findAllDatabaseRelatedFiles(directoryContents);
      await this.deleteAllFoundFiles(relatedFiles);
      await this.waitForFileSystemOperationsToComplete();
    } catch (error) {
      console.warn("Error during database file cleanup:", error);
    }
  }

  private async readDatabaseDirectory(): Promise<string[]> {
    return await FileSystem.readDirectoryAsync(this.dbDirectory);
  }

  private findAllDatabaseRelatedFiles(directoryContents: string[]): string[] {
    const relatedPatterns = this.getDatabaseFilePatterns();

    return directoryContents
      .filter((file) => this.fileMatchesAnyPattern(file, relatedPatterns))
      .map((file) => `${this.dbDirectory}/${file}`);
  }

  private getDatabaseFilePatterns(): string[] {
    return [
      this.dbName,
      `${this.dbName}-journal`,
      `${this.dbName}-shm`,
      `${this.dbName}-wal`,
    ];
  }

  private fileMatchesAnyPattern(fileName: string, patterns: string[]): boolean {
    return patterns.some((pattern) => fileName.includes(pattern));
  }

  private async deleteAllFoundFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.deleteSingleFileIgnoringErrors(filePath);
    }
  }

  private async deleteSingleFileIgnoringErrors(
    filePath: string
  ): Promise<void> {
    await FileSystem.deleteAsync(filePath, { idempotent: true }).catch((err) =>
      console.warn(`Failed to delete ${filePath}:`, err)
    );
  }

  private async waitForFileSystemOperationsToComplete(): Promise<void> {
    await this.waitWithTimeout(300);
  }

  async resetDatabase(): Promise<Database> {
    console.log("Resetting database...");

    this.markOperationInProgress();
    try {
      const db = await this.getDatabase();
      await this.performCompleteReset(db);
      return db;
    } catch (error) {
      return this.handleDatabaseResetError(error);
    } finally {
      this.markOperationComplete();
    }
  }

  private async performCompleteReset(db: Database): Promise<void> {
    await this.dropAllExistingTables(db);
    await this.recreateAllTables(db);
    if (__DEV__) {
      await this.populateTestDataForDevelopment(db);
    }
    await this.verifyResetWasSuccessful(db);
  }

  private async recreateAllTables(db: Database): Promise<void> {
    await this.createAllRequiredTables(db);
  }

  private async handleDatabaseResetError(error: unknown): Promise<Database> {
    console.error("Error during database reset:", error);

    try {
      return await this.attemptRecoveryFromResetError();
    } catch (recoveryError) {
      this.handleRecoveryFailure(error, recoveryError);
      throw error;
    }
  }

  private async attemptRecoveryFromResetError(): Promise<Database> {
    console.log("Attempting recovery with full reinitialization");
    await this.closeExistingConnection();
    await this.waitWithTimeout(1000);
    return await this.initializeDatabase();
  }

  private handleRecoveryFailure(
    originalError: unknown,
    recoveryError: unknown
  ): void {
    console.error("Recovery from reset error failed:", recoveryError);
    const message =
      originalError instanceof Error
        ? originalError.message
        : "Database reset failed";
    Alert.alert("Database Reset Error", message);
  }

  private async verifyResetWasSuccessful(db: Database): Promise<void> {
    const tables = await this.getAllUserTables(db);
    const tableNames = tables.map((t) => t.name);
    console.log(
      `Database reset complete. Found ${
        tables.length
      } tables: ${tableNames.join(", ")}`
    );
  }

  private async getAllUserTables(
    db: Database
  ): Promise<Array<{ name: string }>> {
    return await db.getAllAsync<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"'
    );
  }

  private async dropAllExistingTables(db: Database): Promise<void> {
    try {
      const tables = await this.getExistingTablesFromDatabase(db);
      await this.dropEachTableIndividually(db, tables);
    } catch (error) {
      console.error("Error dropping tables:", error);
      throw error;
    }
  }

  private async dropEachTableIndividually(
    db: Database,
    tables: Array<{ name: string }>
  ): Promise<void> {
    for (const table of tables) {
      await this.dropSingleTable(db, table.name);
    }
  }

  private async dropSingleTable(
    db: Database,
    tableName: string
  ): Promise<void> {
    await db.execAsync(`DROP TABLE IF EXISTS ${tableName}`);
    console.log(`Table ${tableName} dropped`);
  }

  async resetUserProfileTable(): Promise<Database> {
    console.log("Resetting user_profile table...");

    this.markOperationInProgress();
    try {
      const db = await this.getDatabase();
      await this.recreateUserProfileTable(db);
      return db;
    } catch (error) {
      this.handleUserProfileResetError(error);
      throw error;
    } finally {
      this.markOperationComplete();
    }
  }

  private async recreateUserProfileTable(db: Database): Promise<void> {
    await this.dropUserProfileTable(db);
    await this.createUserProfileTable(db);
  }

  private async dropUserProfileTable(db: Database): Promise<void> {
    await this.executeSql(db, "DROP TABLE IF EXISTS user_profile");
  }

  private handleUserProfileResetError(error: unknown): void {
    console.error("Error resetting user profile table:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reset user profile table";
    Alert.alert("Table Reset Error", message);
  }

  async exportData(): Promise<any> {
    const db = await this.getDatabase();
    const allTableNames = await this.getAllTableNames(db);
    return await this.exportAllTableData(db, allTableNames);
  }

  private async exportAllTableData(
    db: Database,
    tableNames: string[]
  ): Promise<Record<string, any[]>> {
    const exportedData: Record<string, any[]> = {};

    for (const tableName of tableNames) {
      const tableRows = await this.getAllRowsFromTable(db, tableName);
      exportedData[tableName] = tableRows;
    }

    return exportedData;
  }

  async importData(data: any): Promise<void> {
    const db = await this.getDatabase();

    try {
      await this.importEachTableData(db, data);
    } catch (error) {
      this.handleDataImportError(error);
      throw error;
    }
  }

  private async importEachTableData(db: Database, data: any): Promise<void> {
    for (const [tableName, rows] of Object.entries(data)) {
      if (this.isValidTableDataForImport(rows)) {
        await this.importSingleTableData(db, tableName, rows as any[]);
      }
    }
  }

  private isValidTableDataForImport(rows: unknown): boolean {
    return Array.isArray(rows) && rows.length > 0;
  }

  private async importSingleTableData(
    db: Database,
    tableName: string,
    rows: any[]
  ): Promise<void> {
    const firstRow = rows[0];
    const columnNames = this.extractColumnNamesForImport(firstRow);

    for (const row of rows) {
      await this.insertOrReplaceRow(db, tableName, columnNames, row);
    }
  }

  private extractColumnNamesForImport(firstRow: any): string[] {
    return Object.keys(firstRow);
  }

  private async insertOrReplaceRow(
    db: Database,
    tableName: string,
    columnNames: string[],
    row: any
  ): Promise<void> {
    const columnString = columnNames.join(", ");
    const valuePlaceholders = columnNames.map(() => "?").join(", ");
    const values = columnNames.map((col) => row[col]);

    const insertQuery = `INSERT OR REPLACE INTO ${tableName} (${columnString}) VALUES (${valuePlaceholders})`;
    await this.executeSql(db, insertQuery, values);
  }

  private handleDataImportError(error: unknown): void {
    console.error("Error during import:", error);
    const message =
      error instanceof Error ? error.message : "Data import failed";
    Alert.alert("Import Error", message);
  }

  private async getAllTableNames(db: Database): Promise<string[]> {
    try {
      const query =
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'";
      const result = await this.querySql(db, query);
      return result.map((row) => row.name);
    } catch (error) {
      console.error("Error getting tables:", error);
      throw error;
    }
  }

  private async getAllRowsFromTable(
    db: Database,
    tableName: string
  ): Promise<any[]> {
    try {
      const query = `SELECT * FROM ${tableName}`;
      return await this.querySql(db, query);
    } catch (error) {
      console.error(`Error getting rows from ${tableName}:`, error);
      throw error;
    }
  }
}
