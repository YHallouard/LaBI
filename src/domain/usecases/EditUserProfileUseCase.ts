import { UserProfile } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class EditUserProfileUseCase {
  private userProfileRepository: UserProfileRepository;

  constructor(userProfileRepository: UserProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  async execute(profile: UserProfile): Promise<boolean> {
    try {
      if (!this.validateRequiredProfileFields(profile)) {
        return false;
      }

      await this.userProfileRepository.update(profile);
      return true;
    } catch (error) {
      console.error("Error in EditUserProfileUseCase:", error);
      throw error;
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
}
