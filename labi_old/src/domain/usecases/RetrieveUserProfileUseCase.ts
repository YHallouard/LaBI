import { UserProfile } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class RetrieveUserProfileUseCase {
  private userProfileRepository: UserProfileRepository;

  constructor(userProfileRepository: UserProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  async execute(): Promise<UserProfile | null> {
    try {
      return await this.retrieveUserProfile();
    } catch (error) {
      return this.handleRetrievalError(error);
    }
  }

  private async retrieveUserProfile(): Promise<UserProfile | null> {
    return await this.userProfileRepository.retrieve();
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleRetrievalError(error: any): never {
    console.error("Error in RetrieveUserProfileUseCase:", error);
    throw error;
  }
}
