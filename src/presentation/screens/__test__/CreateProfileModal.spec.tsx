import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { CreateProfileModal } from "../CreateProfileModal";
import { SaveUserProfileUseCase } from "../../../application/usecases/SaveUserProfileUseCase";
import * as ImagePicker from "expo-image-picker";

jest.mock("../../../application/usecases/SaveUserProfileUseCase");
jest.mock("../../../adapters/repositories/SQLiteUserProfileRepository");
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");
jest.mock("../../components/ScreenLayout", () => ({
  ScreenLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("CreateProfileModal", () => {
  let mockExecute: jest.Mock;
  let mockOnProfileCreated: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute = jest.fn();
    mockOnProfileCreated = jest.fn();

    (SaveUserProfileUseCase as jest.Mock).mockImplementation(() => ({
      execute: mockExecute,
    }));

    // Mock ImagePicker permission and result
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

  test("Given the modal is visible, when rendered, then it should display the profile form", () => {
    // Given/When
    const { getByText, getByPlaceholderText } = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // Then
    expect(getByText("Create Your Profile")).toBeTruthy();
    expect(getByPlaceholderText("Enter your first name")).toBeTruthy();
    expect(getByPlaceholderText("Enter your last name")).toBeTruthy();
    expect(getByText("Male")).toBeTruthy();
    expect(getByText("Female")).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
  });

  test("Given the modal is not visible, when rendered, then it should not be displayed", () => {
    // Given/When
    const { queryByText } = render(
      <CreateProfileModal
        visible={false}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // Then
    expect(queryByText("Create Your Profile")).toBeNull();
  });

  test("Given a valid profile form, when saving, then it should save the profile and call onProfileCreated", async () => {
    // Given
    mockExecute.mockResolvedValue(true);
    const { getByText, getByPlaceholderText } = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // When
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.press(getByText("Male")); // Ensure gender is selected
    fireEvent.press(getByText("Continue"));

    // Then
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
          gender: "male",
        })
      );
      // onProfileCreated should be called after a successful save (with 1.5s timeout)
      expect(mockOnProfileCreated).toHaveBeenCalled();
    });
  });

  test("Given an incomplete profile form, when saving, then it should show validation errors", async () => {
    // Given
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const Alert = require("react-native/Libraries/Alert/Alert");
    const { getByText } = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // When
    fireEvent.press(getByText("Continue"));

    // Then
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "First name cannot be empty"
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test("Given profile image selection, when user picks an image, then it should update the profile image", async () => {
    // Given
    const { getByText } = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // When
    fireEvent.press(getByText("Add Photo"));

    // Then
    await waitFor(() => {
      expect(
        ImagePicker.requestMediaLibraryPermissionsAsync
      ).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  test("Given a save operation fails, when saving profile, then it should show an error", async () => {
    // Given
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const Alert = require("react-native/Libraries/Alert/Alert");
    mockExecute.mockRejectedValue(new Error("Failed to save"));
    const { getByText, getByPlaceholderText } = render(
      <CreateProfileModal
        visible={true}
        onProfileCreated={mockOnProfileCreated}
      />
    );

    // When
    fireEvent.changeText(getByPlaceholderText("Enter your first name"), "John");
    fireEvent.changeText(getByPlaceholderText("Enter your last name"), "Doe");
    fireEvent.press(getByText("Continue"));

    // Then
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        expect.stringContaining("Could not save profile data")
      );
      expect(mockOnProfileCreated).not.toHaveBeenCalled();
    });
  });
});
