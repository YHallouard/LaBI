import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class SavePinnedMetricsUseCase {
  constructor(private userProfileRepository: UserProfileRepository) {}

  async execute(pinnedMetrics: string[]): Promise<void> {
    const userProfile = await this.userProfileRepository.retrieve();

    if (userProfile) {
      userProfile.pinnedMetrics = pinnedMetrics;
      await this.userProfileRepository.save(userProfile);
    } else {
      console.warn("No user profile found. Cannot save pinned metrics.");
    }
  }
}
