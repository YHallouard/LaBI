export interface ProfileServicePort {
  checkProfileExists(): Promise<boolean>;
  setProfileExists(exists: boolean): void;
  resetProfileCheck(): void;
}
