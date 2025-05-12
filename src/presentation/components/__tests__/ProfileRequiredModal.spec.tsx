import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { View } from "react-native";
import { ProfileRequiredModal } from "../ProfileRequiredModal";
import { ProfileService } from "../../../application/services/ProfileService";
import { CreateProfileModal } from "../../screens/CreateProfileModal";

jest.mock("../../../application/services/ProfileService");
jest.mock("../../screens/CreateProfileModal", () => ({
  CreateProfileModal: jest.fn(() => null),
}));

describe("ProfileRequiredModal", () => {
  let mockProfileService: {
    getInstance: jest.Mock;
    checkProfileExists: jest.Mock;
    setProfileExists: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfileService = setupMockProfileService();
  });

  function setupMockProfileService() {
    const profileServiceMock = {
      getInstance: jest.fn(),
      checkProfileExists: jest.fn(),
      setProfileExists: jest.fn(),
    };

    (ProfileService.getInstance as jest.Mock).mockReturnValue(
      profileServiceMock
    );
    profileServiceMock.getInstance.mockReturnValue(profileServiceMock);

    return profileServiceMock;
  }

  function renderModalWithTestContent() {
    return render(
      <ProfileRequiredModal>
        <View testID="test-content">Test Content</View>
      </ProfileRequiredModal>
    );
  }

  function getProfileCreatedCallback() {
    let onProfileCreatedCallback: () => void;

    (CreateProfileModal as jest.Mock).mockImplementation((props) => {
      onProfileCreatedCallback = props.onProfileCreated;
      return null;
    });

    return () => onProfileCreatedCallback();
  }

  test("should show profile modal when user has no profile", async () => {
    mockProfileService.checkProfileExists.mockResolvedValue(false);

    renderModalWithTestContent();

    await waitFor(() => {
      expect(mockProfileService.checkProfileExists).toHaveBeenCalledTimes(1);
      expect(CreateProfileModal).toHaveBeenCalledWith(
        expect.objectContaining({ visible: true }),
        expect.anything()
      );
    });
  });

  test("should not show profile modal when user has a profile", async () => {
    mockProfileService.checkProfileExists.mockResolvedValue(true);

    renderModalWithTestContent();

    await waitFor(() => {
      expect(mockProfileService.checkProfileExists).toHaveBeenCalledTimes(1);
      expect(CreateProfileModal).toHaveBeenCalledWith(
        expect.objectContaining({ visible: false }),
        expect.anything()
      );
    });
  });

  test("should hide modal after profile creation", async () => {
    mockProfileService.checkProfileExists.mockResolvedValue(false);
    const triggerProfileCreated = getProfileCreatedCallback();

    renderModalWithTestContent();

    await waitFor(() => {
      expect(CreateProfileModal).toHaveBeenCalledWith(
        expect.objectContaining({ visible: true }),
        expect.anything()
      );
    });

    act(() => {
      triggerProfileCreated();
    });

    expect(mockProfileService.setProfileExists).toHaveBeenCalledWith(true);
    expect(CreateProfileModal).toHaveBeenLastCalledWith(
      expect.objectContaining({ visible: false }),
      expect.anything()
    );
  });

  test("should show profile modal on profile check error", async () => {
    mockProfileService.checkProfileExists.mockRejectedValue(
      new Error("Test error")
    );

    renderModalWithTestContent();

    await waitFor(() => {
      expect(mockProfileService.checkProfileExists).toHaveBeenCalledTimes(1);
      expect(CreateProfileModal).toHaveBeenCalledWith(
        expect.objectContaining({ visible: true }),
        expect.anything()
      );
    });
  });
});
