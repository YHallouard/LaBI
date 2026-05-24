import { UserProfile } from "../UserProfile";

export class GetUserAgeUseCase {
  execute(userProfile: UserProfile | null): number | null {
    if (!userProfile?.birthDate) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(userProfile.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
