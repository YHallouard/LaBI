import { SQLiteDatabaseStorage } from "../../adapters/infrastructure/SQLiteDatabaseStorage";

let databaseStorageInstance: SQLiteDatabaseStorage | null = null;

export const getDatabaseStorage = (): SQLiteDatabaseStorage => {
  if (!databaseStorageInstance) {
    databaseStorageInstance = new SQLiteDatabaseStorage();
  }
  return databaseStorageInstance;
};

export const initializeDatabase = async () => {
  const storage = getDatabaseStorage();
  const db = await storage.initializeDatabase();

  return db;
};

export const getDatabase = async () => {
  const storage = getDatabaseStorage();
  return storage.getDatabase();
};

export const resetDatabase = async () => {
  const storage = getDatabaseStorage();
  return storage.resetDatabase();
};
