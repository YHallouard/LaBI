import { RetrieveUserProfileUseCase } from "../usecases/RetrieveUserProfileUseCase";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { ProfileServicePort } from "../../ports/services/ProfileServicePort";

export class ProfileService implements ProfileServicePort {
  private static instance: ProfileService | null = null;
  private retrieveUserProfileUseCase: RetrieveUserProfileUseCase | null = null;
  private hasCheckedProfile: boolean = false;
  private profileExists: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public initialize(userProfileRepository: UserProfileRepository): void {
    if (this.isInitialized) {
      return; // Already initialized
    }

    this.retrieveUserProfileUseCase = new RetrieveUserProfileUseCase(
      userProfileRepository
    );
    this.isInitialized = true;
  }

  public async checkProfileExists(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error(
        "ProfileService is not initialized. Call initialize() first."
      );
    }

    if (this.hasCheckedProfile) {
      return this.returnCachedProfileStatus();
    }

    return await this.retrieveAndCacheProfileStatus();
  }

  private returnCachedProfileStatus(): boolean {
    return this.profileExists;
  }

  private async retrieveAndCacheProfileStatus(): Promise<boolean> {
    try {
      const profile = await this.retrieveUserProfileUseCase!.execute();
      return this.updateProfileStatus(!!profile);
    } catch (error) {
      return this.handleProfileRetrievalError(error);
    }
  }

  private updateProfileStatus(exists: boolean): boolean {
    this.profileExists = exists;
    this.hasCheckedProfile = true;
    return this.profileExists;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleProfileRetrievalError(error: any): boolean {
    console.error("Error checking profile exists:", error);
    this.profileExists = false;
    this.hasCheckedProfile = true;
    return false;
  }

  public setProfileExists(exists: boolean): void {
    this.updateProfileStatus(exists);
  }

  public resetProfileCheck(): void {
    this.hasCheckedProfile = false;
  }

  // Method to reset the singleton instance (useful for testing)
  public static resetInstance(): void {
    ProfileService.instance = null;
  }
}
