import { UserProfile } from "../../domain/UserProfile";

export interface UserProfileRepository {
  retrieve(): Promise<UserProfile | null>;
  save(userProfile: UserProfile): Promise<UserProfile>;
  update(profile: UserProfile): Promise<void>;
  reset(): Promise<void>;
}
