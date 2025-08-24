import { UserProfile, Gender } from "../../UserProfile";
import { GetUserAgeUseCase } from "../GetUserAgeUseCase";

describe("GetUserAgeUseCase", () => {
  let useCase: GetUserAgeUseCase;

  beforeEach(() => {
    useCase = new GetUserAgeUseCase();
  });

  test("should return null when userProfile is null", () => {
    const result = useCase.execute(null);
    expect(result).toBeNull();
  });

  test("should return null when userProfile has no birthDate", () => {
    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: null as unknown as Date,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBeNull();
  });

  test("should return null when userProfile birthDate is undefined", () => {
    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: undefined as unknown as Date,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBeNull();
  });

  test("should calculate correct age for person born today", () => {
    const today = new Date();
    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: today,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(0);
  });

  test("should calculate correct age for person born exactly one year ago", () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: oneYearAgo,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(1);
  });

  test("should calculate correct age for person born 25 years ago", () => {
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: twentyFiveYearsAgo,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(25);
  });

  test("should calculate correct age for person born 100 years ago", () => {
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: hundredYearsAgo,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(100);
  });

  test("should calculate correct age when birthday has not occurred this year", () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 30,
      today.getMonth() + 1,
      today.getDate()
    );

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: birthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(29); // Should be 29 since birthday hasn't occurred yet this year
  });

  test("should calculate correct age when birthday has already occurred this year", () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 30,
      today.getMonth() - 1,
      today.getDate()
    );

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: birthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(30); // Should be 30 since birthday has already occurred this year
  });

  test("should calculate correct age when birthday is today", () => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 25,
      today.getMonth(),
      today.getDate()
    );

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: birthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(25); // Should be 25 since it's their birthday today
  });

  test("should calculate correct age when birthday is tomorrow", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const birthDate = new Date(
      today.getFullYear() - 25,
      tomorrow.getMonth(),
      tomorrow.getDate()
    );

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: birthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(24); // Should be 24 since birthday hasn't occurred yet
  });

  test("should calculate correct age when birthday was yesterday", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const birthDate = new Date(
      today.getFullYear() - 25,
      yesterday.getMonth(),
      yesterday.getDate()
    );

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: birthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    expect(result).toBe(25); // Should be 25 since birthday occurred yesterday
  });

  test("should handle leap year birthdays correctly", () => {
    // Test with February 29th in a leap year
    const leapYearBirthDate = new Date(2000, 1, 29); // February 29, 2000 (leap year)

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: leapYearBirthDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    // The exact age will depend on the current date, but it should be a reasonable number
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(150); // Sanity check
  });

  test("should handle future birth dates gracefully", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const userProfile: UserProfile = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: futureDate,
      gender: "male" as Gender,
    };

    const result = useCase.execute(userProfile);
    // Should return a negative number or 0 for future dates
    expect(result).toBeLessThanOrEqual(0);
  });
});
