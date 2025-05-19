import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import {
  ReferenceRange,
  ReferenceRangeCalculator,
} from "../../domain/services/ReferenceRangeCalculator";
import { UserProfile } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class GetReferenceRangeUseCase {
  private referenceRangeCalculator: ReferenceRangeCalculator;
  private userProfileRepository: UserProfileRepository;
  private userProfile: UserProfile | null = null;

  constructor(
    referenceRangeCalculator: ReferenceRangeCalculator,
    userProfileRepository: UserProfileRepository
  ) {
    this.referenceRangeCalculator = referenceRangeCalculator;
    this.userProfileRepository = userProfileRepository;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadUserProfile();
    } catch (error) {
      this.handleProfileLoadError(error);
    }
  }

  private async loadUserProfile(): Promise<void> {
    this.userProfile = await this.userProfileRepository.retrieve();
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleProfileLoadError(error: any): void {
    console.error("Failed to load user profile:", error);
    this.userProfile = null;
  }

  execute(labKey: string, analysisDate: Date): ReferenceRange {
    return this.referenceRangeCalculator.calculateReferenceRange(
      labKey,
      analysisDate,
      this.userProfile
    );
  }

  getForAnalysis(
    analysis: BiologicalAnalysis,
    labKey: string
  ): ReferenceRange {
    return this.execute(labKey, analysis.date);
  }

  generateChartRangesByDates(
    labKey: string,
    dates: Date[]
  ): ReferenceRange[] {
    return dates.map((date) =>
      this.execute(labKey, date)
    );
  }
} 