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
  const [isProfileModalVisible, setIsProfileModalVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check for profile on component mount
    const checkProfileStatus = async () => {
      try {
        const profileService = ProfileService.getInstance();
        const profileExists = await profileService.checkProfileExists();
        setIsProfileModalVisible(!profileExists);
      } catch (error) {
        console.error("Error checking profile status:", error);
      }
    };
    
    checkProfileStatus();
  }, []);

  const handleProfileCreated = () => {
    const profileService = ProfileService.getInstance();
    profileService.setProfileExists(true);
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
