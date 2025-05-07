export interface DatabaseStoragePort {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  initializeDatabase(): Promise<any>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  getDatabase(): Promise<any>;
  databaseExists(): Promise<boolean>;
  deleteDatabase(): Promise<void>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  resetDatabase(): Promise<any>;
}
