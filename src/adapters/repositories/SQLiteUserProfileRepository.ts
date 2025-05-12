import { UserProfile, Gender } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { getDatabase } from "../../infrastructure/database/DatabaseInitializer";

export class SQLiteUserProfileRepository implements UserProfileRepository {
  private readonly tableName = "user_profile";

  constructor() {}

  async retrieve(): Promise<UserProfile | null> {
    try {
      const db = await getDatabase();

      console.log(
        "Database instance obtained, preparing to query user profile..."
      );

      if (!(await this.isTableExisting(db))) {
        console.warn("User profile table does not exist!");
        return null;
      }

      const profileData = await this.fetchProfileData(db);

      if (!profileData) {
        return null;
      }

      return this.mapToUserProfile(profileData);
    } catch (error) {
      console.error("Failed to retrieve user profile:", error);
      return null;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async isTableExisting(db: any): Promise<boolean> {
    const tableCheck = await db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='${this.tableName}'
    `);

    console.log(`User profile table check: ${JSON.stringify(tableCheck)}`);

    return tableCheck.length > 0;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async fetchProfileData(db: any): Promise<any | null> {
    const query = `
      SELECT id, firstName, lastName, birthDate, gender, profileImage
      FROM ${this.tableName}
      LIMIT 1
    `;

    const result = await db.getAllAsync(query);

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
    };
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    try {
      const db = await getDatabase();

      this.ensureNameFields(userProfile);

      const profileExists = await this.checkProfileExists(db);

      if (profileExists) {
        await this.updateExistingProfile(db, userProfile);
      } else {
        await this.insertNewProfile(db, userProfile);
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

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async checkProfileExists(db: any): Promise<boolean> {
    const checkQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const checkResult = await db.getAllAsync(checkQuery);
    return (
      checkResult.length > 0 && (checkResult[0] as { count: number }).count > 0
    );
  }

  private async updateExistingProfile(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    db: any,
    userProfile: UserProfile
  ): Promise<void> {
    const profileImageSQL = this.formatProfileImageForSQL(
      userProfile.profileImage
    );

    const updateQuery = `
      UPDATE ${this.tableName} SET 
      firstName = '${userProfile.firstName}',
      lastName = '${userProfile.lastName}',
      birthDate = '${userProfile.birthDate.toISOString()}',
      gender = '${userProfile.gender}',
      profileImage = ${profileImageSQL}
    `;

    await db.execAsync(updateQuery);
  }

  private async insertNewProfile(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    db: any,
    userProfile: UserProfile
  ): Promise<void> {
    const profileImageSQL = this.formatProfileImageForSQL(
      userProfile.profileImage
    );

    const insertQuery = `
      INSERT INTO ${this.tableName} 
      (firstName, lastName, birthDate, gender, profileImage) 
      VALUES 
      ('${userProfile.firstName}', '${
      userProfile.lastName
    }', '${userProfile.birthDate.toISOString()}', '${userProfile.gender}', 
       ${profileImageSQL})
    `;

    await db.execAsync(insertQuery);

    await this.retrieveAndSetNewProfileId(db, userProfile);
  }

  private formatProfileImageForSQL(profileImage?: string): string {
    const sanitizedImage = profileImage
      ? this.sanitizeString(profileImage)
      : null;
    return sanitizedImage ? `'${sanitizedImage}'` : "NULL";
  }

  private async retrieveAndSetNewProfileId(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    db: any,
    userProfile: UserProfile
  ): Promise<void> {
    const idQuery = `SELECT last_insert_rowid() as id`;
    const idResult = await db.getAllAsync(idQuery);

    if (idResult && idResult.length > 0) {
      userProfile.id = (idResult[0] as { id: string }).id;
    }
  }

  async update(profile: UserProfile): Promise<void> {
    await this.save(profile);
  }

  async reset(): Promise<void> {
    try {
      const db = await getDatabase();
      await this.deleteAllProfiles(db);
    } catch (error) {
      console.error("Failed to reset user profile:", error);
      throw error;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async deleteAllProfiles(db: any): Promise<void> {
    const query = `DELETE FROM ${this.tableName}`;
    await db.execAsync(query);
  }
}
