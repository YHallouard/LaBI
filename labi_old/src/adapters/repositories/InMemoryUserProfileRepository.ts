import { UserProfile } from "../../domain/UserProfile";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";

export class InMemoryUserProfileRepository implements UserProfileRepository {
  private profile: UserProfile | null = null;
  private shouldThrowError = false;

  constructor(profile: UserProfile | null = null, shouldThrowError = false) {
    this.profile = profile;
    this.shouldThrowError = shouldThrowError;
  }

  async retrieve(): Promise<UserProfile | null> {
    if (this.shouldThrowError) {
      throw new Error("Repository error");
    }
    return this.profile;
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    this.profile = userProfile;
    return userProfile;
  }

  async update(profile: UserProfile): Promise<void> {
    this.profile = profile;
  }

  async reset(): Promise<void> {
    this.profile = null;
  }

  setProfile(profile: UserProfile | null): void {
    this.profile = profile;
  }

  setShouldThrowError(shouldThrow: boolean): void {
    this.shouldThrowError = shouldThrow;
  }
}
