/**
 * In-memory implementation of Expo's SecureStore for testing purposes.
 * Mimics the functionality of SecureStore but stores data in memory.
 */
export class InMemorySecureStore {
  private static store: Record<string, string> = {};

  /**
   * Store a value in the in-memory secure store.
   * @param key The key to store the value under
   * @param value The value to store
   */
  static async setItemAsync(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }

  /**
   * Retrieve a value from the in-memory secure store.
   * @param key The key to retrieve the value for
   * @returns The stored value, or null if no value is found for the key
   */
  static async getItemAsync(key: string): Promise<string | null> {
    return key in this.store ? this.store[key] : null;
  }

  /**
   * Delete a value from the in-memory secure store.
   * @param key The key to delete
   */
  static async deleteItemAsync(key: string): Promise<void> {
    delete this.store[key];
  }

  /**
   * Clear all values from the in-memory secure store.
   * This method doesn't exist in the real SecureStore API but is useful for testing.
   */
  static async clear(): Promise<void> {
    this.store = {};
  }
}
