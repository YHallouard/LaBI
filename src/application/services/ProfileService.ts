import { RetrieveUserProfileUseCase } from "../usecases/RetrieveUserProfileUseCase";
import { SQLiteUserProfileRepository } from "../../adapters/repositories/SQLiteUserProfileRepository";

export class ProfileService {
  private static instance: ProfileService;
  private userProfileRepository: SQLiteUserProfileRepository;
  private retrieveUserProfileUseCase: RetrieveUserProfileUseCase;
  private hasCheckedProfile: boolean = false;
  private profileExists: boolean = false;

  private constructor() {
    this.userProfileRepository = new SQLiteUserProfileRepository();
    this.retrieveUserProfileUseCase = new RetrieveUserProfileUseCase(
      this.userProfileRepository
    );
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public async checkProfileExists(): Promise<boolean> {
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
      const profile = await this.retrieveUserProfileUseCase.execute();
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
}
