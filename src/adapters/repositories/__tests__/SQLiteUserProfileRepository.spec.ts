import { SQLiteUserProfileRepository } from "../SQLiteUserProfileRepository";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import * as DatabaseInitializer from "../../../infrastructure/database/DatabaseInitializer";

jest.mock("../../../infrastructure/database/DatabaseInitializer");

describe("SQLiteUserProfileRepository", () => {
  let repository: SQLiteUserProfileRepository;
  const mockDb = {
    getAllAsync: jest.fn(),
    execAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (DatabaseInitializer.getDatabase as jest.Mock).mockResolvedValue(mockDb);

    repository = new SQLiteUserProfileRepository();
  });

  describe("retrieve", () => {
    test("should return null when table does not exist", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      const result = await repository.retrieve();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("sqlite_master")
      );
      expect(result).toBeNull();
    });

    test("should return null when no profile data exists", async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ name: "user_profile" }])
        .mockResolvedValueOnce([]);

      const result = await repository.retrieve();

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    });

    test("should return profile when data exists", async () => {
      const mockProfileData = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        birthDate: "2000-01-01T00:00:00.000Z",
        gender: "male",
        profileImage: null,
      };

      mockDb.getAllAsync
        .mockResolvedValueOnce([{ name: "user_profile" }])
        .mockResolvedValueOnce([mockProfileData]);

      const result = await repository.retrieve();

      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
      expect(result?.lastName).toBe("Doe");
      expect(result?.gender).toBe("male");
      expect(result?.name).toBe("John Doe");
      expect(result?.birthDate).toBeInstanceOf(Date);
    });
  });

  describe("save", () => {
    test("should insert new profile when none exists", async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ id: "1" }]);

      const profile: UserProfile = {
        id: "",
        firstName: "Jane",
        lastName: "Smith",
        name: "Jane Smith",
        birthDate: new Date("2000-01-01"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      const result = await repository.save(profile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_profile")
      );
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT last_insert_rowid() as id"
      );
      expect(result.id).toBe("1");
    });

    test("should update existing profile", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profile: UserProfile = {
        id: "1",
        firstName: "Jane",
        lastName: "Smith",
        name: "Jane Smith",
        birthDate: new Date("2000-01-01"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      const result = await repository.save(profile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE user_profile SET")
      );
      expect(result.id).toBe("1");
    });

    test("should parse name into components when firstName/lastName are missing", async () => {
      // Mock the database query for checkProfileExists
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // For checkProfileExists
        .mockResolvedValueOnce([{ id: "1" }]); // For retrieveAndSetNewProfileId

      await repository.save({
        id: "",
        name: "Alice Smith",
        firstName: "",
        lastName: "",
        gender: "female",
        birthDate: new Date("1990-01-01"),
        profileImage: "",
      });

      // Make sure we're checking for execution of any SQL containing Alice
      expect(mockDb.execAsync).toHaveBeenCalled();
      // Check the arguments passed to execAsync to verify they contain the expected name parts
      const execCalls = mockDb.execAsync.mock.calls;
      expect(execCalls.length).toBeGreaterThan(0);
      expect(execCalls.some((call) => call[0].includes("Alice"))).toBe(true);
      expect(execCalls.some((call) => call[0].includes("Smith"))).toBe(true);
    });

    test("should properly handle SQL injection in string fields", async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ id: "1" }]);

      const profile: UserProfile = {
        id: "",
        firstName: "O'Reilly",
        lastName: "D'Angelo",
        name: "O'Reilly D'Angelo",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
      };

      await repository.save(profile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("O''Reilly")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("D''Angelo")
      );
    });
  });

  describe("reset", () => {
    test("should delete all profiles", async () => {
      await repository.reset();

      expect(mockDb.execAsync).toHaveBeenCalledWith("DELETE FROM user_profile");
    });
  });
});
