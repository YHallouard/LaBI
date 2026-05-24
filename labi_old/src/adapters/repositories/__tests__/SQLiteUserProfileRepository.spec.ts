import { SQLiteUserProfileRepository } from "../SQLiteUserProfileRepository";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import { DatabaseStoragePort } from "../../../ports/infrastructure/DatabaseStoragePort";

describe("SQLiteUserProfileRepository", () => {
  let repository: SQLiteUserProfileRepository;
  let mockDb: { getAllAsync: jest.Mock; execAsync: jest.Mock };
  let mockDatabaseStorage: DatabaseStoragePort;

  const profile: UserProfile = {
    id: "",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    birthDate: new Date("2000-01-01"),
    gender: "male" as Gender,
    profileImage: undefined,
  };

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
      execAsync: jest.fn(),
    };

    // Mock database storage port
    mockDatabaseStorage = {
      getDatabase: jest.fn().mockResolvedValue(mockDb),
      initializeDatabase: jest.fn().mockResolvedValue(undefined),
      databaseExists: jest.fn().mockResolvedValue(true),
      deleteDatabase: jest.fn().mockResolvedValue(undefined),
      resetDatabase: jest.fn().mockResolvedValue(undefined),
      exportData: jest.fn().mockResolvedValue({
        biological_analyses: [],
        user_profile: [],
      }),
      importData: jest.fn().mockResolvedValue(undefined),
    };

    jest.clearAllMocks();
    repository = new SQLiteUserProfileRepository(mockDatabaseStorage);
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

  describe("update", () => {
    test("should update existing profile successfully", async () => {
      // Mock that profile exists
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const updatedProfile: UserProfile = {
        id: "1",
        firstName: "Jane",
        lastName: "Smith",
        name: "Jane Smith",
        birthDate: new Date("1995-05-15"),
        gender: "female" as Gender,
        profileImage: "new-image.jpg",
      };

      await repository.update(updatedProfile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE user_profile SET")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("Jane")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("Smith")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("female")
      );
    });

    test("should create new profile when none exists", async () => {
      // Mock that no profile exists
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ id: "1" }]);

      const newProfile: UserProfile = {
        id: "",
        firstName: "Alice",
        lastName: "Johnson",
        name: "Alice Johnson",
        birthDate: new Date("1990-03-20"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      await repository.update(newProfile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_profile")
      );
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT last_insert_rowid() as id"
      );
    });

    test("should handle profile with pinned metrics", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithMetrics: UserProfile = {
        id: "1",
        firstName: "Bob",
        lastName: "Wilson",
        name: "Bob Wilson",
        birthDate: new Date("1985-12-10"),
        gender: "male" as Gender,
        profileImage: "avatar.jpg",
        pinnedMetrics: ["glucose", "cholesterol"],
      };

      await repository.update(profileWithMetrics);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("pinnedMetrics")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('["glucose","cholesterol"]')
      );
    });

    test("should handle profile with null pinned metrics", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithNullMetrics: UserProfile = {
        id: "1",
        firstName: "Carol",
        lastName: "Davis",
        name: "Carol Davis",
        birthDate: new Date("1992-08-25"),
        gender: "female" as Gender,
        profileImage: undefined,
        pinnedMetrics: undefined,
      };

      await repository.update(profileWithNullMetrics);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("pinnedMetrics = NULL")
      );
    });

    test("should handle profile with empty pinned metrics array", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithEmptyMetrics: UserProfile = {
        id: "1",
        firstName: "David",
        lastName: "Brown",
        name: "David Brown",
        birthDate: new Date("1988-11-05"),
        gender: "male" as Gender,
        profileImage: "profile.jpg",
        pinnedMetrics: [],
      };

      await repository.update(profileWithEmptyMetrics);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("pinnedMetrics = '[]'")
      );
    });

    test("should handle profile with special characters in name", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithSpecialChars: UserProfile = {
        id: "1",
        firstName: "José",
        lastName: "O'Connor",
        name: "José O'Connor",
        birthDate: new Date("1980-06-15"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithSpecialChars);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("José")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("O''Connor")
      );
    });

    test("should handle profile with very long name", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const longName = "A".repeat(1000);
      const profileWithLongName: UserProfile = {
        id: "1",
        firstName: longName,
        lastName: "Test",
        name: `${longName} Test`,
        birthDate: new Date("1975-04-12"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithLongName);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining(longName)
      );
    });

    test("should handle profile with different gender values", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const maleProfile: UserProfile = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(maleProfile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("gender = 'male'")
      );

      // Reset mocks for next test
      jest.clearAllMocks();
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const femaleProfile: UserProfile = {
        id: "1",
        firstName: "Jane",
        lastName: "Doe",
        name: "Jane Doe",
        birthDate: new Date("1990-01-01"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      await repository.update(femaleProfile);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("gender = 'female'")
      );
    });

    test("should handle profile with different date formats", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithDate: UserProfile = {
        id: "1",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        birthDate: new Date("2000-12-31T23:59:59.999Z"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithDate);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("2000-12-31T23:59:59.999Z")
      );
    });

    test("should handle profile with profile image URL", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithImage: UserProfile = {
        id: "1",
        firstName: "Image",
        lastName: "User",
        name: "Image User",
        birthDate: new Date("1995-07-20"),
        gender: "female" as Gender,
        profileImage: "https://example.com/avatar.jpg",
      };

      await repository.update(profileWithImage);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("https://example.com/avatar.jpg")
      );
    });

    test("should handle profile with null profile image", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithNullImage: UserProfile = {
        id: "1",
        firstName: "NoImage",
        lastName: "User",
        name: "NoImage User",
        birthDate: new Date("1990-03-15"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithNullImage);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("profileImage = NULL")
      );
    });

    test("should handle profile with undefined profile image", async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]);

      const profileWithUndefinedImage: UserProfile = {
        id: "1",
        firstName: "UndefinedImage",
        lastName: "User",
        name: "UndefinedImage User",
        birthDate: new Date("1985-09-10"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithUndefinedImage);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("profileImage = NULL")
      );
    });

    test("should handle profile with missing name fields and parse from name", async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ id: "1" }]);

      const profileWithMissingNameFields: UserProfile = {
        id: "",
        firstName: "",
        lastName: "",
        name: "John Smith",
        birthDate: new Date("1980-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithMissingNameFields);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_profile")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("John")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("Smith")
      );
    });

    test("should handle profile with only name field", async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ id: "1" }]);

      const profileWithOnlyName: UserProfile = {
        id: "",
        firstName: "",
        lastName: "",
        name: "SingleName",
        birthDate: new Date("1990-01-01"),
        gender: "female" as Gender,
        profileImage: undefined,
      };

      await repository.update(profileWithOnlyName);

      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_profile")
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining("SingleName")
      );
    });
  });

  describe("update error handling", () => {
    test("should throw error when database query fails during update", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync.mockRejectedValueOnce(
        new Error("Database query failed")
      );

      const profile: UserProfile = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.update(profile)).rejects.toThrow(
        "Database query failed"
      );

      consoleSpy.mockRestore();
    });

    test("should throw error when database update fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]); // Profile exists
      mockDb.execAsync.mockRejectedValueOnce(new Error("Update failed"));

      const profile: UserProfile = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.update(profile)).rejects.toThrow("Update failed");

      consoleSpy.mockRestore();
    });

    test("should throw error when database insert fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // No profile exists
        .mockResolvedValueOnce([{ id: "1" }]); // Get new ID
      mockDb.execAsync.mockRejectedValueOnce(new Error("Insert failed"));

      const profile: UserProfile = {
        id: "",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.update(profile)).rejects.toThrow("Insert failed");

      consoleSpy.mockRestore();
    });

    test("should throw error when getting new profile ID fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // No profile exists
        .mockRejectedValueOnce(new Error("Failed to get new ID")); // Get new ID fails
      mockDb.execAsync.mockResolvedValueOnce(undefined); // Insert succeeds

      const profile: UserProfile = {
        id: "",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.update(profile)).rejects.toThrow(
        "Failed to get new ID"
      );

      consoleSpy.mockRestore();
    });

    test("should handle database initialization failure", async () => {
      const failingDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(null),
      };

      const failingRepository = new SQLiteUserProfileRepository(
        failingDbStorage
      );

      const profile: UserProfile = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("1990-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(failingRepository.update(profile)).rejects.toThrow(
        "Failed to initialize database"
      );
    });
  });

  describe("Error handling", () => {
    test("should throw error when database initialization fails", async () => {
      const failingDbStorage: DatabaseStoragePort = {
        ...mockDatabaseStorage,
        getDatabase: jest.fn().mockResolvedValue(null),
      };

      const failingRepository = new SQLiteUserProfileRepository(
        failingDbStorage
      );
      // The constructor automatically calls initialize(), so we need to wait for it to reject
      await expect(failingRepository["initialized"]).rejects.toThrow(
        "Failed to initialize database"
      );
    });
  });

  test("should return null in retrieve when error in getAllAsync", async () => {
    mockDb.getAllAsync.mockRejectedValueOnce(new Error("Database error"));

    const result = await repository.retrieve();

    expect(result).toBeNull();
  });

  test("should return null in reset when error in execAsync", async () => {
    mockDb.execAsync.mockRejectedValueOnce(new Error("Database error"));
    expect(repository.reset()).rejects.toThrow("Database error");
  });

  describe("save error handling", () => {
    test("should throw error when execAsync fails during insert", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // checkProfileExists - no existing profile
        .mockResolvedValueOnce([{ id: "1" }]); // insertNewProfile
      mockDb.execAsync.mockRejectedValueOnce(
        new Error("Database insert failed")
      );

      const profile: UserProfile = {
        id: "",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("2000-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.save(profile)).rejects.toThrow(
        "Database insert failed"
      );

      consoleSpy.mockRestore();
    });

    test("should throw error when execAsync fails during update", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync.mockResolvedValueOnce([{ count: 1 }]); // checkProfileExists - existing profile
      mockDb.execAsync.mockRejectedValueOnce(
        new Error("Database update failed")
      );

      await expect(repository.save(profile)).rejects.toThrow(
        "Database update failed"
      );

      consoleSpy.mockRestore();
    });

    test("should throw error when getAllAsync fails during checkProfileExists", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync.mockRejectedValueOnce(
        new Error("Database query failed")
      );

      await expect(repository.save(profile)).rejects.toThrow(
        "Database query failed"
      );

      consoleSpy.mockRestore();
    });

    test("should throw error when getAllAsync fails during retrieveAndSetNewProfileId", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // checkProfileExists - no existing profile
        .mockRejectedValueOnce(new Error("Failed to get new profile ID")); // retrieveAndSetNewProfileId fails
      mockDb.execAsync.mockResolvedValueOnce(undefined); // insert succeeds

      const profile: UserProfile = {
        id: "",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        birthDate: new Date("2000-01-01"),
        gender: "male" as Gender,
        profileImage: undefined,
      };

      await expect(repository.save(profile)).rejects.toThrow(
        "Failed to get new profile ID"
      );

      consoleSpy.mockRestore();
    });
  });
});
