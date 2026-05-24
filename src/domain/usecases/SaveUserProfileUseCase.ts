import { UserProfile } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class SaveUserProfileUseCase {
  private userProfileRepository: UserProfileRepository;

  constructor(userProfileRepository: UserProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  async execute(profile: UserProfile): Promise<boolean> {
    try {
      if (!this.validateRequiredProfileFields(profile)) {
        return false;
      }

      await this.saveProfileToRepository(profile);
      return true;
    } catch (error) {
      return this.handleSaveError(error);
    }
  }

  private validateRequiredProfileFields(profile: UserProfile): boolean {
    if (!profile.firstName || !profile.lastName) {
      console.error(
        "Profile validation failed: firstName and lastName are required"
      );
      return false;
    }
    return true;
  }

  private async saveProfileToRepository(
    profile: UserProfile
  ): Promise<UserProfile> {
    return await this.userProfileRepository.save(profile);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleSaveError(error: any): never {
    console.error("Error in SaveUserProfileUseCase:", error);
    throw error;
  }
}
