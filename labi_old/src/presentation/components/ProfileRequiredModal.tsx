import React, { useEffect, useState } from "react";
import { ProfileServicePort } from "../../ports/services/ProfileServicePort";
import { CreateProfileModal } from "./CreateProfileModal";

type ProfileRequiredModalProps = {
  children: React.ReactNode;
  profileService: ProfileServicePort;
};

export const ProfileRequiredModal: React.FC<ProfileRequiredModalProps> = ({
  children,
  profileService,
}) => {
  const [isProfileModalVisible, setIsProfileModalVisible] =
    useState<boolean>(false);

  useEffect(() => {
    // Check for profile on component mount
    const checkProfileStatus = async () => {
      try {
        const profileExists = await profileService.checkProfileExists();
        setIsProfileModalVisible(!profileExists);
      } catch (error) {
        console.error("Error checking profile status:", error);
      }
    };

    checkProfileStatus();
  }, [profileService]);

  const handleProfileCreated = () => {
    profileService.setProfileExists(true);
    setIsProfileModalVisible(false);
  };

  return (
    <>
      {children}
      <CreateProfileModal
        visible={isProfileModalVisible}
        onProfileCreated={handleProfileCreated}
      />
    </>
  );
};
