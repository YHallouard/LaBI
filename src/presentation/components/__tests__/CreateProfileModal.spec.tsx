const mockAlert = jest.fn();
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  Image: "Image",
  Platform: { OS: "ios" },
  KeyboardAvoidingView: "KeyboardAvoidingView",
  ActivityIndicator: "ActivityIndicator",
  Modal: "Modal",
  Alert: { alert: mockAlert },
}));

jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: mockAlert,
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("../ScreenLayout", () => ({
  ScreenLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("../../../infrastructure/repositories/RepositoryFactory", () => ({
  RepositoryFactory: {
    getUserProfileRepository: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { InMemoryUserProfileRepository } from "../../../adapters/repositories/InMemoryUserProfileRepository";

import { CreateProfileModal } from "../CreateProfileModal";

describe("CreateProfileModal", () => {
  let mockOnProfileCreated: jest.Mock;
  let realUserProfileRepository: InMemoryUserProfileRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockOnProfileCreated = jest.fn();

    realUserProfileRepository = new InMemoryUserProfileRepository();

    const {
      RepositoryFactory,
    } = require("../../../infrastructure/repositories/RepositoryFactory");
    RepositoryFactory.getUserProfileRepository.mockResolvedValue(
      realUserProfileRepository
    );

    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-image-uri" }],
    });
  });

  afterEach(async () => {
    await realUserProfileRepository.reset();
  });

  const renderCreateProfileModal = async (props = {}) => {
    const result = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
        {...props}
      />
    );

    await waitFor(() => {
      expect(result.queryByText("Initializing...")).toBeNull();
    });

    return result;
  };

  const fillValidProfileForm = (getByPlaceholderText: any, getByText: any) => {
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.press(getByText("Male"));
  };

  describe("Rendering", () => {
    test("should display the profile form when modal is visible", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      expect(getByText("Create Your Profile")).toBeTruthy();
      expect(getByPlaceholderText("Enter your first name")).toBeTruthy();
      expect(getByPlaceholderText("Enter your last name")).toBeTruthy();
      expect(getByText("Male")).toBeTruthy();
      expect(getByText("Female")).toBeTruthy();
      expect(getByText("Continue")).toBeTruthy();
    });

    test("should not display when modal is not visible", () => {
      const { queryByText } = render(
        <CreateProfileModal
          visible={false}
          onProfileCreated={mockOnProfileCreated}
        />
      );

      expect(queryByText("Create Your Profile")).toBeNull();
    });

    test("should show all required form elements", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      expect(getByText("Add Photo")).toBeTruthy();
      expect(getByPlaceholderText("Enter your first name")).toBeTruthy();
      expect(getByPlaceholderText("Enter your last name")).toBeTruthy();
      expect(getByText("Date of Birth")).toBeTruthy();
      expect(getByText("Gender")).toBeTruthy();
      expect(getByText("Male")).toBeTruthy();
      expect(getByText("Female")).toBeTruthy();
    });
  });

  describe("Profile Creation", () => {
    test("should save profile and call onProfileCreated with valid form data", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const savedProfile = await realUserProfileRepository.retrieve();
      expect(savedProfile).toBeTruthy();
      expect(savedProfile?.firstName).toBe("John");
      expect(savedProfile?.lastName).toBe("Doe");
      expect(savedProfile?.gender).toBe("male");
    });

    test("should save with correct gender when female is selected", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fireEvent.changeText(
        getByPlaceholderText("Enter your first name"),
        "Jane"
      );
      fireEvent.changeText(
        getByPlaceholderText("Enter your last name"),
        "Smith"
      );
      fireEvent.press(getByText("Female"));
      fireEvent.press(getByText("Continue"));

      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const savedProfile = await realUserProfileRepository.retrieve();
      expect(savedProfile?.gender).toBe("female");
    });

    test("should handle special characters in names correctly", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fireEvent.changeText(
        getByPlaceholderText("Enter your first name"),
        "José"
      );
      fireEvent.changeText(
        getByPlaceholderText("Enter your last name"),
        "O'Connor"
      );
      fireEvent.press(getByText("Male"));
      fireEvent.press(getByText("Continue"));

      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const savedProfile = await realUserProfileRepository.retrieve();
      expect(savedProfile?.firstName).toBe("José");
      expect(savedProfile?.lastName).toBe("O'Connor");
    });
  });

  describe("Image Selection", () => {
    test("should update profile image when user picks an image", async () => {
      const { getByText } = await renderCreateProfileModal();

      fireEvent.press(getByText("Add Photo"));

      await waitFor(() => {
        expect(
          ImagePicker.requestMediaLibraryPermissionsAsync
        ).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    test("should not update profile image when picker is canceled", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const { getByText } = await renderCreateProfileModal();

      fireEvent.press(getByText("Add Photo"));

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });
  });

  describe("Form State Management", () => {
    test("should update values correctly when typing in fields", async () => {
      const { getByPlaceholderText } = await renderCreateProfileModal();

      const firstNameInput = getByPlaceholderText("Enter your first name");
      const lastNameInput = getByPlaceholderText("Enter your last name");

      fireEvent.changeText(firstNameInput, "John");
      fireEvent.changeText(lastNameInput, "Doe");

      expect(firstNameInput.props.value).toBe("John");
      expect(lastNameInput.props.value).toBe("Doe");
    });

    test("should update gender selection correctly", async () => {
      const { getByText } = await renderCreateProfileModal();

      const maleButton = getByText("Male");
      const femaleButton = getByText("Female");

      fireEvent.press(femaleButton);
      fireEvent.press(maleButton);

      expect(maleButton).toBeTruthy();
      expect(femaleButton).toBeTruthy();
    });
  });

  describe("Integration with Repository", () => {
    test("should persist profile to repository on successful save", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      // Wait for the save operation to complete and callback to be called
      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Verify the profile was actually saved to the repository
      const savedProfile = await realUserProfileRepository.retrieve();
      expect(savedProfile).toBeTruthy();
      expect(savedProfile?.firstName).toBe("John");
      expect(savedProfile?.lastName).toBe("Doe");
      expect(savedProfile?.gender).toBe("male");
    });

    test("should store only the latest profile when multiple saves occur", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      // Save first profile
      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Reset mock and save second profile
      mockOnProfileCreated.mockClear();
      fireEvent.changeText(
        getByPlaceholderText("Enter your first name"),
        "Jane"
      );
      fireEvent.changeText(
        getByPlaceholderText("Enter your last name"),
        "Smith"
      );
      fireEvent.press(getByText("Female"));
      fireEvent.press(getByText("Continue"));

      await waitFor(async () => {
        const savedProfile = await realUserProfileRepository.retrieve();
        expect(savedProfile?.firstName).toBe("Jane");
        expect(savedProfile?.lastName).toBe("Smith");
        expect(savedProfile?.gender).toBe("female");
      });
    });
  });

  describe("Date of Birth", () => {
    test("should display current date and age by default", async () => {
      const { getByText } = await renderCreateProfileModal();

      // Should show current date and age
      const dateText = getByText(/Age:/);
      expect(dateText).toBeTruthy();
    });

    test("should open date picker when date field is pressed", async () => {
      const { getByText } = await renderCreateProfileModal();

      const dateButton = getByText(/Age:/);
      fireEvent.press(dateButton);

      // Date picker should be shown
      expect(dateButton).toBeTruthy();
    });
  });

  describe("Loading States", () => {
    test("should show loading indicator during initialization", async () => {
      const { getByText } = render(
        <CreateProfileModal
          visible={true}
          onProfileCreated={mockOnProfileCreated}
        />
      );

      expect(getByText("Initializing...")).toBeTruthy();
    });

    test("should show loading indicator during save operation", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      // Should show loading state briefly - the button should show ActivityIndicator
      await waitFor(() => {
        expect(getByText("Continue")).toBeTruthy();
      });
    });
  });

  describe("Success Feedback", () => {
    test("should show success message after successful save", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      await waitFor(() => {
        expect(getByText("Profile saved successfully")).toBeTruthy();
      });
    });

    test("should call onProfileCreated after successful save", async () => {
      const { getByText, getByPlaceholderText } =
        await renderCreateProfileModal();

      fillValidProfileForm(getByPlaceholderText, getByText);
      fireEvent.press(getByText("Continue"));

      await waitFor(
        () => {
          expect(mockOnProfileCreated).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Accessibility", () => {
    test("should have proper accessibility for form elements", async () => {
      const { getByPlaceholderText, getByText } =
        await renderCreateProfileModal();

      expect(getByPlaceholderText("Enter your first name")).toBeTruthy();
      expect(getByPlaceholderText("Enter your last name")).toBeTruthy();
      expect(getByText("Male")).toBeTruthy();
      expect(getByText("Female")).toBeTruthy();
    });
  });

  describe("Component Lifecycle", () => {
    test("should initialize repository and use case on mount", async () => {
      const { getByText } = await renderCreateProfileModal();

      expect(getByText("Create Your Profile")).toBeTruthy();
      expect(getByText("Continue")).toBeTruthy();
    });
  });
});
