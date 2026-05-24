import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class GetPinnedMetricsUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(): Promise<string[]> {
    const userProfile = await this.userProfileRepository.retrieve();
    return userProfile?.pinnedMetrics || [];
  }
}
