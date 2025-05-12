import React, { useState } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { UserProfile, Gender } from "../../domain/UserProfile";
import { SaveUserProfileUseCase } from "../../application/usecases/SaveUserProfileUseCase";
import { SQLiteUserProfileRepository } from "../../adapters/repositories/SQLiteUserProfileRepository";

type CreateProfileModalProps = {
  visible: boolean;
  onProfileCreated: () => void;
};

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  visible,
  onProfileCreated,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    firstName: "",
    lastName: "",
    birthDate: new Date(),
    gender: "male" as Gender,
    profileImage: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [error, setError] = useState<string | null>(null);

  const [userProfileRepository] = useState(
    () => new SQLiteUserProfileRepository()
  );
  const [saveUserProfileUseCase] = useState(
    () => new SaveUserProfileUseCase(userProfileRepository)
  );

  const saveProfile = async () => {
    if (!isProfileValid()) {
      return;
    }

    const validatedProfile = createValidatedProfile();

    setIsSaving(true);
    try {
      const saveResult = await saveUserProfileUseCase.execute(validatedProfile);
      if (saveResult) {
        showSuccessAndNotifyCreation();
      } else {
        throw new Error("Save operation returned false");
      }
    } catch (error) {
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const createValidatedProfile = (): UserProfile => {
    return {
      ...profile,
      firstName: profile.firstName ? profile.firstName.trim() : "Unknown",
      lastName: profile.lastName ? profile.lastName.trim() : "Unknown",
    };
  };

  const showSuccessAndNotifyCreation = () => {
    setSuccessMessage("Profile saved successfully");
    scheduleSuccessMessageDismissal();
    scheduleProfileCreatedCallback();
  };

  const scheduleSuccessMessageDismissal = () => {
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const scheduleProfileCreatedCallback = () => {
    setTimeout(() => {
      onProfileCreated();
    }, 1500);
  };

  const handleSaveError = (error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    Alert.alert("Error", `Could not save profile data: ${errorMessage}`);
  };

  const isProfileValid = (): boolean => {
    if (!isFirstNameValid()) return false;
    if (!isLastNameValid()) return false;
    if (!isBirthDateValid()) return false;
    if (!isGenderSelected()) return false;

    return true;
  };

  const isFirstNameValid = (): boolean => {
    if (!profile.firstName.trim()) {
      Alert.alert("Error", "First name cannot be empty");
      return false;
    }
    return true;
  };

  const isLastNameValid = (): boolean => {
    if (!profile.lastName.trim()) {
      Alert.alert("Error", "Last name cannot be empty");
      return false;
    }
    return true;
  };

  const isBirthDateValid = (): boolean => {
    if (!profile.birthDate) {
      Alert.alert("Error", "Date of birth is required");
      return false;
    }
    return true;
  };

  const isGenderSelected = (): boolean => {
    if (!profile.gender) {
      Alert.alert("Error", "Please select a gender");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const permissionResult = await requestMediaLibraryPermission();
    if (!permissionResult) return;

    const result = await launchImagePicker();
    handleImageSelectionResult(result);
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera roll permission to upload a profile picture"
      );
      return false;
    }
    return true;
  };

  const launchImagePicker = async () => {
    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  };

  const handleImageSelectionResult = (
    result: ImagePicker.ImagePickerResult
  ) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateProfileWithSelectedImage(result.assets[0].uri);
    }
  };

  const updateProfileWithSelectedImage = (imageUri: string) => {
    setProfile({ ...profile, profileImage: imageUri });
  };
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    handleDatePickerVisibilityForAndroid();
    updateBirthDateIfSelected(selectedDate);
  };

  const handleDatePickerVisibilityForAndroid = () => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const updateBirthDateIfSelected = (selectedDate?: Date) => {
    if (selectedDate) {
      setProfile({ ...profile, birthDate: selectedDate });
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
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

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    if (isBirthdayNotYetOccurred(today, birthDate)) {
      age--;
    }

    return age;
  };

  const isBirthdayNotYetOccurred = (today: Date, birthDate: Date): boolean => {
    const m = today.getMonth() - birthDate.getMonth();
    return m < 0 || (m === 0 && today.getDate() < birthDate.getDate());
  };

  const updateFirstName = (text: string) => {
    setProfile({ ...profile, firstName: text });
  };

  const updateLastName = (text: string) => {
    setProfile({ ...profile, lastName: text });
  };

  const selectMaleGender = () => {
    setProfile({ ...profile, gender: "male" as Gender });
  };

  const selectFemaleGender = () => {
    setProfile({ ...profile, gender: "female" as Gender });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="formSheet"
    >
      <ScreenLayout>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <HeaderSection />

            {successMessage && (
              <SuccessMessageDisplay message={successMessage} />
            )}
            {error && <ErrorMessageDisplay message={error} />}

            <ProfileImageSection profile={profile} onPickImage={pickImage} />

            <PersonalInformationSection
              profile={profile}
              onFirstNameChange={updateFirstName}
              onLastNameChange={updateLastName}
              birthDateFormatted={formatBirthDate(profile.birthDate)}
              age={calculateAge(profile.birthDate)}
              onOpenDatePicker={openDatePicker}
              showDatePicker={showDatePicker}
              onDateChange={handleDateChange}
              onDatePickerDismiss={hideDatePicker}
              onSelectMale={selectMaleGender}
              onSelectFemale={selectFemaleGender}
            />

            <SaveButton onPress={saveProfile} isSaving={isSaving} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenLayout>
    </Modal>
  );
};

const HeaderSection = () => (
  <>
    <Text style={styles.title}>Create Your Profile</Text>
    <Text style={styles.subtitle}>
      Please complete your profile to continue. This information is used to
      calculate appropriate reference ranges for your lab tests.
    </Text>
  </>
);

const SuccessMessageDisplay = ({ message }: { message: string }) => (
  <View style={styles.successMessageContainer}>
    <Text style={styles.successMessageText}>{message}</Text>
  </View>
);

const ErrorMessageDisplay = ({ message }: { message: string }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

const ProfileImageSection = ({
  profile,
  onPickImage,
}: {
  profile: UserProfile;
  onPickImage: () => void;
}) => {
  const renderProfileImage = () => {
    if (profile.profileImage) {
      return (
        <Image
          source={{ uri: profile.profileImage }}
          style={styles.profileImage}
        />
      );
    } else {
      return (
        <InitialsDisplay
          firstName={profile.firstName}
          lastName={profile.lastName}
        />
      );
    }
  };

  return (
    <View style={styles.imageSection}>
      {renderProfileImage()}
      <TouchableOpacity style={styles.changeImageButton} onPress={onPickImage}>
        <Ionicons name="camera-outline" size={24} color="#2c7be5" />
        <Text style={styles.changeImageText}>Add Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

const InitialsDisplay = ({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <View style={styles.initialsContainer}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
};

const PersonalInformationSection = ({
  profile,
  onFirstNameChange,
  onLastNameChange,
  birthDateFormatted,
  age,
  onOpenDatePicker,
  showDatePicker,
  onDateChange,
  onDatePickerDismiss,
  onSelectMale,
  onSelectFemale,
}: {
  profile: UserProfile;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  birthDateFormatted: string;
  age: number;
  onOpenDatePicker: () => void;
  showDatePicker: boolean;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onDateChange: (event: any, date?: Date) => void;
  onDatePickerDismiss: () => void;
  onSelectMale: () => void;
  onSelectFemale: () => void;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
    </View>

    <NameInputFields
      firstName={profile.firstName}
      lastName={profile.lastName}
      onFirstNameChange={onFirstNameChange}
      onLastNameChange={onLastNameChange}
    />

    <DateOfBirthField
      birthDateFormatted={birthDateFormatted}
      age={age}
      onOpenDatePicker={onOpenDatePicker}
      showDatePicker={showDatePicker}
      birthDate={profile.birthDate}
      onDateChange={onDateChange}
      onDatePickerDismiss={onDatePickerDismiss}
    />

    <GenderSelectionField
      selectedGender={profile.gender}
      onSelectMale={onSelectMale}
      onSelectFemale={onSelectFemale}
    />
  </View>
);

const NameInputFields = ({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: {
  firstName: string;
  lastName: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
}) => (
  <>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={onFirstNameChange}
        placeholder="Enter your first name"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={onLastNameChange}
        placeholder="Enter your last name"
      />
    </View>
  </>
);

const DateOfBirthField = ({
  birthDateFormatted,
  age,
  onOpenDatePicker,
  showDatePicker,
  birthDate,
  onDateChange,
  onDatePickerDismiss,
}: {
  birthDateFormatted: string;
  age: number;
  onOpenDatePicker: () => void;
  showDatePicker: boolean;
  birthDate: Date;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onDateChange: (event: any, date?: Date) => void;
  onDatePickerDismiss: () => void;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Date of Birth</Text>
    <TouchableOpacity
      style={styles.datePickerButton}
      onPress={onOpenDatePicker}
      activeOpacity={0.6}
    >
      <Ionicons
        name="calendar-outline"
        size={18}
        color="#2c7be5"
        style={styles.calendarIcon}
      />
      <Text style={styles.datePickerButtonText}>
        {birthDateFormatted} (Age: {age})
      </Text>
      <Ionicons name="chevron-down" size={16} color="#95aac9" />
    </TouchableOpacity>

    {showDatePicker && (
      <DatePickerDisplay
        birthDate={birthDate}
        onDateChange={onDateChange}
        onDismiss={onDatePickerDismiss}
      />
    )}
    <Text style={styles.fieldHint}>Tap to change date</Text>
  </View>
);

const DatePickerDisplay = ({
  birthDate,
  onDateChange,
  onDismiss,
}: {
  birthDate: Date;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onDateChange: (event: any, date?: Date) => void;
  onDismiss: () => void;
}) => (
  <View style={styles.inlineDatePickerContainer}>
    {Platform.OS === "ios" ? (
      <IOSDatePicker
        birthDate={birthDate}
        onDateChange={onDateChange}
        onDismiss={onDismiss}
      />
    ) : (
      <AndroidDatePicker birthDate={birthDate} onDateChange={onDateChange} />
    )}
  </View>
);

const IOSDatePicker = ({
  birthDate,
  onDateChange,
  onDismiss,
}: {
  birthDate: Date;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onDateChange: (event: any, date?: Date) => void;
  onDismiss: () => void;
}) => (
  <View style={styles.iosInlinePicker}>
    <DateTimePicker
      value={birthDate || new Date()}
      mode="date"
      display="spinner"
      onChange={onDateChange}
      maximumDate={new Date()}
      style={styles.iosPicker}
    />
    <View style={styles.iosButtonRow}>
      <TouchableOpacity onPress={onDismiss} style={styles.iosDatePickerButton}>
        <Text style={styles.iosDatePickerButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDismiss}
        style={[styles.iosDatePickerButton, styles.iosDatePickerDoneButton]}
      >
        <Text
          style={[styles.iosDatePickerButtonText, styles.iosDatePickerDoneText]}
        >
          Done
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const AndroidDatePicker = ({
  birthDate,
  onDateChange,
}: {
  birthDate: Date;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onDateChange: (event: any, date?: Date) => void;
}) => (
  <DateTimePicker
    value={birthDate || new Date()}
    mode="date"
    display="default"
    onChange={onDateChange}
    maximumDate={new Date()}
  />
);

const GenderSelectionField = ({
  selectedGender,
  onSelectMale,
  onSelectFemale,
}: {
  selectedGender: Gender;
  onSelectMale: () => void;
  onSelectFemale: () => void;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Gender</Text>
    <Text style={styles.genderNote}>For medical analysis purposes only</Text>

    <View style={styles.genderOptions}>
      <GenderOption
        label="Male"
        isSelected={selectedGender === "male"}
        onSelect={onSelectMale}
      />

      <GenderOption
        label="Female"
        isSelected={selectedGender === "female"}
        onSelect={onSelectFemale}
      />
    </View>
  </View>
);

const GenderOption = ({
  label,
  isSelected,
  onSelect,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <TouchableOpacity
    style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
    onPress={onSelect}
  >
    <Text
      style={[
        styles.genderOptionText,
        isSelected && styles.genderOptionTextSelected,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const SaveButton = ({
  onPress,
  isSaving,
}: {
  onPress: () => void;
  isSaving: boolean;
}) => (
  <TouchableOpacity
    style={styles.saveButton}
    onPress={onPress}
    disabled={isSaving}
  >
    {isSaving ? (
      <ActivityIndicator size="small" color="#ffffff" />
    ) : (
      <Text style={styles.saveButtonText}>Continue</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
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
  calendarIcon: {
    marginRight: 10,
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
