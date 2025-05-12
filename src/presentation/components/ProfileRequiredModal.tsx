import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ProfileService } from "../../application/services/ProfileService";
import { CreateProfileModal } from "../screens/CreateProfileModal";

type ProfileRequiredModalProps = {
  children: React.ReactNode;
};

export const ProfileRequiredModal: React.FC<ProfileRequiredModalProps> = ({
  children,
}) => {
  const [isProfileModalVisible, setIsProfileModalVisible] =
    useState<boolean>(false);
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(true);

  const checkProfileStatus = async () => {
    setIsCheckingProfile(true);
    try {
      const profileExists = await fetchProfileExistsFromService();
      setIsProfileModalVisible(!profileExists);
    } catch (error) {
      handleProfileCheckError(error);
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const fetchProfileExistsFromService = async (): Promise<boolean> => {
    const profileService = ProfileService.getInstance();
    return await profileService.checkProfileExists();
  };

  const handleProfileCheckError = (error: unknown): void => {
    console.error("Error checking profile status:", error);
    setIsProfileModalVisible(true);
  };

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const handleProfileCreated = () => {
    updateProfileServiceWithCreatedProfile();
    hideProfileModal();
  };

  const updateProfileServiceWithCreatedProfile = (): void => {
    const profileService = ProfileService.getInstance();
    profileService.setProfileExists(true);
  };

  const hideProfileModal = (): void => {
    setIsProfileModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {children}

      <CreateProfileModal
        visible={isProfileModalVisible}
        onProfileCreated={handleProfileCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});
