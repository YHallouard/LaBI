import { RetrieveUserProfileUseCase } from "../usecases/RetrieveUserProfileUseCase";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { RepositoryFactory } from "../../infrastructure/repositories/RepositoryFactory";

export class ProfileService {
  private static instance: ProfileService;
  private userProfileRepository: UserProfileRepository | null = null;
  private retrieveUserProfileUseCase: RetrieveUserProfileUseCase | null = null;
  private hasCheckedProfile: boolean = false;
  private profileExists: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.userProfileRepository = await RepositoryFactory.getUserProfileRepository();
      this.retrieveUserProfileUseCase = new RetrieveUserProfileUseCase(
        this.userProfileRepository
      );
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing ProfileService:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public async checkProfileExists(): Promise<boolean> {
    await this.ensureInitialized();
    
    if (this.hasCheckedProfile) {
      return this.returnCachedProfileStatus();
    }

    return await this.retrieveAndCacheProfileStatus();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    
    if (!this.isInitialized || !this.retrieveUserProfileUseCase) {
      throw new Error("ProfileService is not initialized properly");
    }
  }

  private returnCachedProfileStatus(): boolean {
    return this.profileExists;
  }

  private async retrieveAndCacheProfileStatus(): Promise<boolean> {
    try {
      if (!this.retrieveUserProfileUseCase) {
        throw new Error("RetrieveUserProfileUseCase is not initialized");
      }
      
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
