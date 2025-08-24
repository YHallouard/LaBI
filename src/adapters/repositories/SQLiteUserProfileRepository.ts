import { UserProfile, Gender } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import { Database } from "../infrastructure/SQLiteDatabaseStorage";

export class SQLiteUserProfileRepository implements UserProfileRepository {
  private readonly tableName = "user_profile";
  private db!: Database;
  private initialized: Promise<void>;

  constructor(private readonly dbStorage: DatabaseStoragePort) {
    this.initialized = this.initialize();
  }

  private async initialize(): Promise<void> {
    this.db = await this.dbStorage.getDatabase();
    if (!this.db) {
      throw new Error("Failed to initialize database");
    }
  }

  async retrieve(): Promise<UserProfile | null> {
    try {
      await this.initialized;

      if (!(await this.isTableExisting())) {
        console.warn("User profile table does not exist!");
        return null;
      }

      const profileData = await this.fetchProfileData();

      if (!profileData) {
        return null;
      }

      return this.mapToUserProfile(profileData);
    } catch (error) {
      console.error("Failed to retrieve user profile:", error);
      return null;
    }
  }

  private async isTableExisting(): Promise<boolean> {
    const tableCheck = await this.db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='${this.tableName}'
    `);

    console.log(`User profile table check: ${JSON.stringify(tableCheck)}`);

    return tableCheck.length > 0;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async fetchProfileData(): Promise<any | null> {
    const query = `
      SELECT id, firstName, lastName, birthDate, gender, profileImage, pinnedMetrics
      FROM ${this.tableName}
      LIMIT 1
    `;

    const result = await this.db.getAllAsync(query);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private mapToUserProfile(profileData: any): UserProfile {
    return {
      id: profileData.id,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      birthDate: profileData.birthDate
        ? new Date(profileData.birthDate)
        : new Date(),
      gender: profileData.gender as Gender,
      profileImage: profileData.profileImage,
      pinnedMetrics: profileData.pinnedMetrics
        ? JSON.parse(profileData.pinnedMetrics)
        : [],
    };
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    try {
      await this.initialized;

      this.ensureNameFields(userProfile);

      const profileExists = await this.checkProfileExists();

      if (profileExists) {
        await this.updateExistingProfile(userProfile);
      } else {
        await this.insertNewProfile(userProfile);
      }

      return userProfile;
    } catch (error) {
      console.error("Failed to save user profile:", error);
      throw error;
    }
  }

  private ensureNameFields(userProfile: UserProfile): void {
    userProfile.firstName = this.sanitizeString(userProfile.firstName || "");
    userProfile.lastName = this.sanitizeString(userProfile.lastName || "");

    if (userProfile.name && (!userProfile.firstName || !userProfile.lastName)) {
      this.parseNameIntoComponents(userProfile);
    }
  }

  private sanitizeString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private parseNameIntoComponents(userProfile: UserProfile): void {
    const nameParts = (userProfile.name || "").split(" ");
    if (nameParts.length > 1) {
      userProfile.firstName = nameParts[0];
      userProfile.lastName = nameParts.slice(1).join(" ");
    } else {
      userProfile.firstName = userProfile.name || "";
      userProfile.lastName = "";
    }
  }

  private async checkProfileExists(): Promise<boolean> {
    const checkQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const checkResult = await this.db.getAllAsync(checkQuery);
    return (
      checkResult.length > 0 && (checkResult[0] as { count: number }).count > 0
    );
  }

  private async updateExistingProfile(userProfile: UserProfile): Promise<void> {
    const profileImageSQL = this.formatProfileImageForSQL(
      userProfile.profileImage
    );
    const pinnedMetricsSQL = this.formatPinnedMetricsForSQL(
      userProfile.pinnedMetrics
    );

    const updateQuery = `
      UPDATE ${this.tableName} SET 
      firstName = '${userProfile.firstName}',
      lastName = '${userProfile.lastName}',
      birthDate = '${userProfile.birthDate.toISOString()}',
      gender = '${userProfile.gender}',
      profileImage = ${profileImageSQL},
      pinnedMetrics = ${pinnedMetricsSQL}
    `;

    await this.db.execAsync(updateQuery);
  }

  private async insertNewProfile(userProfile: UserProfile): Promise<void> {
    const profileImageSQL = this.formatProfileImageForSQL(
      userProfile.profileImage
    );
    const pinnedMetricsSQL = this.formatPinnedMetricsForSQL(
      userProfile.pinnedMetrics
    );

    const insertQuery = `
      INSERT INTO ${this.tableName} 
      (firstName, lastName, birthDate, gender, profileImage, pinnedMetrics) 
      VALUES 
      ('${userProfile.firstName}', '${
      userProfile.lastName
    }', '${userProfile.birthDate.toISOString()}', '${userProfile.gender}', 
       ${profileImageSQL}, ${pinnedMetricsSQL})
    `;

    await this.db.execAsync(insertQuery);

    await this.retrieveAndSetNewProfileId(userProfile);
  }

  private formatProfileImageForSQL(profileImage?: string): string {
    const sanitizedImage = profileImage
      ? this.sanitizeString(profileImage)
      : null;
    return sanitizedImage ? `'${sanitizedImage}'` : "NULL";
  }

  private formatPinnedMetricsForSQL(pinnedMetrics?: string[]): string {
    if (!pinnedMetrics) {
      return "NULL";
    }
    const jsonString = JSON.stringify(pinnedMetrics);
    return `'${this.sanitizeString(jsonString)}'`;
  }

  private async retrieveAndSetNewProfileId(
    userProfile: UserProfile
  ): Promise<void> {
    const idQuery = `SELECT last_insert_rowid() as id`;
    const idResult = await this.db.getAllAsync(idQuery);

    if (idResult && idResult.length > 0) {
      userProfile.id = (idResult[0] as { id: string }).id;
    }
  }

  async update(profile: UserProfile): Promise<void> {
    await this.save(profile);
  }

  async reset(): Promise<void> {
    try {
      await this.initialized;
      await this.deleteAllProfiles();
    } catch (error) {
      console.error("Failed to reset user profile:", error);
      throw error;
    }
  }

  private async deleteAllProfiles(): Promise<void> {
    const query = `DELETE FROM ${this.tableName}`;
    await this.db.execAsync(query);
  }
}
