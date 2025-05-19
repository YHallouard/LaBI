import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { UserProfile, Gender } from "../../domain/UserProfile";
import { SaveUserProfileUseCase } from "../../application/usecases/SaveUserProfileUseCase";
import { EditUserProfileUseCase } from "../../application/usecases/EditUserProfileUseCase";
import { RetrieveUserProfileUseCase } from "../../application/usecases/RetrieveUserProfileUseCase";
import { SQLiteUserProfileRepository } from "../../adapters/repositories/SQLiteUserProfileRepository";
import { RepositoryFactory } from "../../infrastructure/repositories/RepositoryFactory";

type ProfileScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "ProfileScreen">;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    firstName: "",
    lastName: "",
    birthDate: new Date(),
    gender: "male" as Gender,
    profileImage: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
   
  const [error, setError] = useState<string | null>(null);

  // Initialize repository and use cases within useEffect to ensure they're only created once
  const [userProfileRepository, setUserProfileRepository] = useState<SQLiteUserProfileRepository | null>(null);
  const [saveUserProfileUseCase, setSaveUserProfileUseCase] = useState<SaveUserProfileUseCase | null>(null);
  const [editUserProfileUseCase, setEditUserProfileUseCase] = useState<EditUserProfileUseCase | null>(null);
  const [retrieveUserProfileUseCase, setRetrieveUserProfileUseCase] = useState<RetrieveUserProfileUseCase | null>(null);

  useEffect(() => {
    const initializeRepositories = async () => {
      try {
        console.log("Initializing repositories and use cases");
        const repository = await RepositoryFactory.getUserProfileRepository();
        setUserProfileRepository(repository as SQLiteUserProfileRepository);
        
        const saveUseCase = new SaveUserProfileUseCase(repository);
        const editUseCase = new EditUserProfileUseCase(repository);
        const retrieveUseCase = new RetrieveUserProfileUseCase(repository);
        
        setSaveUserProfileUseCase(saveUseCase);
        setEditUserProfileUseCase(editUseCase);
        setRetrieveUserProfileUseCase(retrieveUseCase);
        
        // Load profile after repositories are initialized
        await loadProfile(retrieveUseCase);
      } catch (error) {
        console.error("Error initializing repositories:", error);
        setError("Could not initialize repositories");
        setIsLoading(false);
      }
    };
    
    initializeRepositories();
  }, []);

  const loadProfile = async (retrieveUseCase?: RetrieveUserProfileUseCase | null) => {
    console.log("Beginning loadProfile function");
    setIsLoading(true);
    try {
      // Use the passed use case or the state one
      const useCase = retrieveUseCase || retrieveUserProfileUseCase;
      
      if (!useCase) {
        throw new Error("RetrieveUserProfileUseCase is not initialized");
      }
      
      // Directly try to get the single profile
      const savedProfile = await useCase.execute();
      console.log(
        "Retrieved profile:",
        savedProfile ? JSON.stringify(savedProfile) : "No profile found"
      );

      if (savedProfile) {
        setProfile(savedProfile);
        setProfileExists(true);
        setIsEditMode(false);
        console.log("Loaded existing profile");
      } else {
        // Default profile if none exists
        const defaultProfile = {
          id: "",
          firstName: "",
          lastName: "",
          birthDate: new Date(),
          gender: "male" as Gender,
          profileImage: undefined,
        };
        setProfile(defaultProfile);
        setProfileExists(false);
        setIsEditMode(true);
        console.log("Set default profile");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Could not load profile data");

      // Still set a default profile so the UI has something to display
      const defaultProfile = {
        id: "",
        firstName: "",
        lastName: "",
        birthDate: new Date(),
        gender: "male" as Gender,
        profileImage: undefined,
      };
      setProfile(defaultProfile);
      setProfileExists(false);
      setIsEditMode(true);
      console.log("Set default profile after loading error");
    } finally {
      setIsLoading(false);
      console.log("Profile loading completed");
    }
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // Ensure profile has valid birthDate before entering edit mode
      setProfile((prevProfile) => ({
        ...prevProfile,
        birthDate: prevProfile.birthDate || new Date(),
      }));
    }
    setIsEditMode(!isEditMode);
  };

  const saveProfile = async () => {
    console.log(
      "Current profile state before validation:",
      JSON.stringify(profile)
    );

    if (!validateProfile()) {
      return;
    }

    // Extra validation for database constraints
    const validatedProfile = {
      ...profile,
      firstName: profile.firstName ? profile.firstName.trim() : "Unknown",
      lastName: profile.lastName ? profile.lastName.trim() : "Unknown",
    };

    console.log(
      "Validated profile being saved:",
      JSON.stringify(validatedProfile)
    );

    setIsSaving(true);
    try {
      // Try a different approach: always treat as new profile for now
      try {
        const saveResult = await saveUserProfileUseCase?.execute(
          validatedProfile
        );
        if (saveResult) {
          console.log("New profile saved successfully");
          showSuccessMessage();
        } else {
          throw new Error("Save operation returned false");
        }
      } catch (saveError) {
        console.error(
          "Error saving as new profile, trying update instead:",
          saveError
        );

        // If saving fails, try updating instead
        const updateResult = await editUserProfileUseCase?.execute(
          validatedProfile
        );
        if (updateResult) {
          console.log("Profile updated successfully");
          showSuccessMessage();
        } else {
          throw new Error("Update operation returned false");
        }
      }

      // Update the profile state with validated values
      setProfile(validatedProfile);
      setProfileExists(true);
      setIsEditMode(false);

      // Navigate back after successful save if desired
      setTimeout(() => {
        navigation.goBack();
      }, 1500); // Short delay to show success message
    } catch (error) {
      console.error("Error saving profile:", error);

      // Show a detailed error message to help debug
      Alert.alert(
        "Error",
        `Could not save profile data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const validateProfile = (): boolean => {
    if (!profile.firstName.trim()) {
      Alert.alert("Error", "First name cannot be empty");
      return false;
    }

    if (!profile.lastName.trim()) {
      Alert.alert("Error", "Last name cannot be empty");
      return false;
    }

    if (!profile.birthDate) {
      Alert.alert("Error", "Date of birth is required");
      return false;
    }

    if (!profile.gender) {
      Alert.alert("Error", "Please select a gender");
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera roll permission to upload a profile picture"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfile({ ...profile, profileImage: result.assets[0].uri });
    }
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setProfile({ ...profile, birthDate: selectedDate });
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const formatBirthDate = (date?: Date): string => {
    if (!date) return "Select Date";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const renderProfileImage = () => {
    if (profile.profileImage) {
      return (
        <Image
          source={{ uri: profile.profileImage }}
          style={styles.profileImage}
        />
      );
    } else {
      const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(
        0
      )}`.toUpperCase();
      return (
        <View style={styles.initialsContainer}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      );
    }
  };

  const showSuccessMessage = () => {
    setSuccessMessage("Profile saved successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const calculateAge = (birthDate: Date | undefined): number => {
    if (!birthDate) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>
            This information is used to calculate appropriate reference ranges
            for your lab tests. A profile is required to use the app.
          </Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.imageSection}>
            {renderProfileImage()}
            {isEditMode && (
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={24} color="#2c7be5" />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {profileExists && !isEditMode && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={toggleEditMode}
                >
                  <Ionicons name="pencil-outline" size={20} color="#2c7be5" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              {isEditMode ? (
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(text) =>
                    setProfile({ ...profile, firstName: text })
                  }
                  placeholder="Enter your first name"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.firstName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              {isEditMode ? (
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(text) =>
                    setProfile({ ...profile, lastName: text })
                  }
                  placeholder="Enter your last name"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.lastName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              {isEditMode ? (
                <>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={openDatePicker}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#2c7be5"
                      style={styles.calendarIcon}
                    />
                    <Text style={styles.datePickerButtonText}>
                      {formatBirthDate(profile.birthDate)} (Age:{" "}
                      {calculateAge(profile.birthDate)})
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#95aac9" />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <View style={styles.inlineDatePickerContainer}>
                      {Platform.OS === "ios" ? (
                        <View style={styles.iosInlinePicker}>
                          <DateTimePicker
                            value={profile.birthDate || new Date()}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            style={styles.iosPicker}
                          />
                          <View style={styles.iosButtonRow}>
                            <TouchableOpacity
                              onPress={() => setShowDatePicker(false)}
                              style={styles.iosDatePickerButton}
                            >
                              <Text style={styles.iosDatePickerButtonText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                if (profile.birthDate) {
                                  setShowDatePicker(false);
                                }
                              }}
                              style={[
                                styles.iosDatePickerButton,
                                styles.iosDatePickerDoneButton,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.iosDatePickerButtonText,
                                  styles.iosDatePickerDoneText,
                                ]}
                              >
                                Done
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <DateTimePicker
                          value={profile.birthDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </View>
                  )}
                  <Text style={styles.fieldHint}>Tap to change date</Text>
                </>
              ) : (
                <Text style={styles.fieldValue}>
                  {formatBirthDate(profile.birthDate)}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.genderNote}>
                For medical analysis purposes only
              </Text>

              {isEditMode ? (
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      profile.gender === "male" && styles.genderOptionSelected,
                    ]}
                    onPress={() =>
                      setProfile({ ...profile, gender: "male" as Gender })
                    }
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        profile.gender === "male" &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      profile.gender === "female" &&
                        styles.genderOptionSelected,
                    ]}
                    onPress={() =>
                      setProfile({ ...profile, gender: "female" as Gender })
                    }
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        profile.gender === "female" &&
                          styles.genderOptionTextSelected,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.gender === "male" ? "Male" : "Female"}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#12263f",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#95aac9",
    marginBottom: 24,
  },
  imageSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
    width: "100%",
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#f1f4f8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  initialsContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#2c7be5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#f1f4f8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  initialsText: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  changeImageText: {
    color: "#2c7be5",
    marginLeft: 5,
    fontSize: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: "100%",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#12263f",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f1f4f8",
    borderRadius: 6,
  },
  editButtonText: {
    color: "#2c7be5",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#12263f",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e3ebf6",
  },
  inputGroup: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#5a7184",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3ebf6",
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    width: "100%",
    backgroundColor: "#fcfcfc",
  },
  dateInputContainer: {
    width: "100%",
  },
  dateTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  calendarIcon: {
    marginRight: 10,
    color: "#2c7be5",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cdd9e9",
    borderRadius: 8,
    padding: 14,
    paddingRight: 16,
    width: "100%",
    backgroundColor: "#f9fafb",
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#12263f",
    flex: 1,
    marginRight: 10,
  },
  genderNote: {
    fontSize: 12,
    color: "#95aac9",
    marginBottom: 10,
    fontStyle: "italic",
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e3ebf6",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  genderOptionSelected: {
    backgroundColor: "#2c7be5",
    borderColor: "#2c7be5",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#12263f",
  },
  genderOptionTextSelected: {
    color: "white",
  },
  saveButton: {
    backgroundColor: "#2c7be5",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    width: "100%",
    shadowColor: "#2c7be5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerFullWidthContainer: {
    position: "relative",
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    marginVertical: 15,
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e9ecef",
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
    overflow: "hidden",
  },
  datePicker: {
    width: 280,
    height: 220,
    marginBottom: Platform.OS === "ios" ? 10 : 0,
    alignSelf: "center",
  },
  iosCloseButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#2c7be5",
    shadowColor: "#2c7be5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  iosCloseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  iosDatePickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
    marginBottom: 15,
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e3ebf6",
  },
  iosButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ebf6",
  },
  iosDatePickerButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  iosDatePickerButtonText: {
    fontSize: 16,
    color: "#2c7be5",
  },
  iosDatePickerDoneButton: {
    backgroundColor: "#2c7be5",
    borderRadius: 6,
  },
  iosDatePickerDoneText: {
    color: "white",
    fontWeight: "600",
  },
  iosPicker: {
    height: 200,
    width: "100%",
  },
  fieldHint: {
    fontSize: 12,
    color: "#95aac9",
    marginTop: 2,
    marginLeft: 5,
    fontStyle: "italic",
  },
  inlineDatePickerContainer: {
    width: "100%",
    marginTop: 5,
    marginBottom: 10,
  },
  iosInlinePicker: {
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e3ebf6",
    overflow: "hidden",
  },
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  successMessageContainer: {
    backgroundColor: "rgba(0, 217, 126, 0.1)",
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  successMessageText: {
    color: "#00d97e",
    fontSize: 16,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(230, 55, 87, 0.1)",
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  errorText: {
    color: "#e63757",
    fontSize: 16,
    textAlign: "center",
  },
});
