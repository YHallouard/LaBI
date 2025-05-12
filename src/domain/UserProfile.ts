export type Gender = "male" | "female";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; // Optional field for combined name
  birthDate: Date;
  gender: Gender;
  profileImage?: string;
}
