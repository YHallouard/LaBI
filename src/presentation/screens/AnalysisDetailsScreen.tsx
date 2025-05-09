import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import { GetAnalysisByIdUseCase } from "../../application/usecases/GetAnalysesUseCase";
import { UpdateAnalysisUseCase } from "../../application/usecases/UpdateAnalysisUseCase";
import {
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
  LAB_VALUE_REFERENCE_RANGES,
  LAB_VALUE_CATEGORIES,
} from "../../config/LabConfig";
import { ScreenLayout } from "../components/ScreenLayout";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

// Define the props type for the AnalysisDetails screen
interface AnalysisDetailsScreenProps
  extends StackScreenProps<HomeStackParamList, "AnalysisDetails"> {
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase;
  updateAnalysisUseCase: UpdateAnalysisUseCase;
}

// Composant pour saisir des valeurs numériques avec point décimal
const DecimalInput = ({
  value,
  onChangeText,
  onFocus,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  style?: any;
}) => {
  const inputRef = useRef<TextInput>(null);

  const addDecimalPoint = () => {
    if (!value.includes(".")) {
      onChangeText(value + ".");
    }

    focusInputField();
  };

  const focusInputField = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.decimalInputContainer}>
      <TextInput
        ref={inputRef}
        style={[styles.valueInput, style]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        onFocus={onFocus}
      />
      <TouchableOpacity style={styles.decimalButton} onPress={addDecimalPoint}>
        <Text style={styles.decimalButtonText}>.</Text>
      </TouchableOpacity>
    </View>
  );
};

const AnalysisDetailsScreen: React.FC<AnalysisDetailsScreenProps> = ({
  route,
  navigation,
  getAnalysisByIdUseCase,
  updateAnalysisUseCase,
}) => {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editedValues, setEditedValues] = useState<Record<string, LabValue>>(
    {}
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>(
    {}
  );
  const [editedDate, setEditedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const result = await getAnalysisByIdUseCase.execute(analysisId);
      setAnalysis(result);
      if (result) {
        setEditedDate(result.date);
      }
      setError(null);

      initializeFormValues(result);
    } catch (err) {
      console.error("Failed to load analysis:", err);
      setError("Failed to load analysis details");
    } finally {
      setLoading(false);
    }
  };

  const initializeLabValueWithDefaults = (key: string): LabValue => {
    return {
      value: 0,
      unit: LAB_VALUE_UNITS[key] || "",
    };
  };

  const initializeFormValues = (result: BiologicalAnalysis | null) => {
    if (!result) return;

    const initialValues: Record<string, LabValue> = {};
    const initialRawInputs: Record<string, string> = {};
    const initialActiveMetrics: Record<string, boolean> = {};

    LAB_VALUE_KEYS.forEach((key) => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const value = (result as any)[key] as LabValue | undefined;
      const isActive = isLabValueActive(value);

      initialActiveMetrics[key] = isActive;

      if (isActive && value) {
        initialValues[key] = { ...value };
        initialRawInputs[key] =
          value.value != null ? value.value.toString() : "0";
      } else {
        initialValues[key] = initializeLabValueWithDefaults(key);
        initialRawInputs[key] = "";
      }
    });

    setEditedValues(initialValues);
    setRawInputs(initialRawInputs);
    setActiveMetrics(initialActiveMetrics);
  };

  const isLabValueActive = (value: LabValue | undefined): boolean => {
    return (
      value !== undefined &&
      value !== null &&
      typeof value.value === "number" &&
      !isNaN(value.value)
    );
  };

  const handleValueChange = (key: string, text: string) => {
    setRawInputs((prev) => ({
      ...prev,
      [key]: text,
    }));

    const sanitizedText = text.replace(",", ".");
    const numValue = parseFloat(sanitizedText);

    if (!isNaN(numValue)) {
      setEditedValues((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: numValue,
        },
      }));
    } else if (text === "" || text === ".") {
      setEditedValues((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: 0,
        },
      }));
    }
  };

  const handleUnitChange = (key: string, unit: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        unit,
      },
    }));
  };

  const handleMetricToggle = (key: string, isActive: boolean) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [key]: isActive,
    }));

    if (!isActive) {
      clearMetricValue(key);
    } else if (rawInputs[key] === "") {
      initializeMetricValue(key);
    }
  };

  const clearMetricValue = (key: string) => {
    setRawInputs((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const initializeMetricValue = (key: string) => {
    setRawInputs((prev) => ({
      ...prev,
      [key]: "0",
    }));

    setEditedValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: 0,
      },
    }));
  };

  const saveChanges = async () => {
    if (!analysis) return;

    try {
      setSaving(true);

      const updatedAnalysis = createUpdatedAnalysis();

      await updateAnalysisUseCase.execute(updatedAnalysis);

      setAnalysis(updatedAnalysis);
      setIsEditing(false);
      displaySuccessMessage();
    } catch (err) {
      console.error("Failed to save changes:", err);
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const createUpdatedAnalysis = (): BiologicalAnalysis => {
    const updatedAnalysis: BiologicalAnalysis = {
      ...(analysis as BiologicalAnalysis),
      date: editedDate,
    };

    LAB_VALUE_KEYS.forEach((key) => {
      if (activeMetrics[key]) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (updatedAnalysis as any)[key] = editedValues[key];
      } else {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (updatedAnalysis as any)[key] = null;
      }
    });

    return updatedAnalysis;
  };

  const displaySuccessMessage = () => {
    setSuccessMessage("Analysis updated successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const cancelEditing = () => {
    if (!analysis) return;

    setEditedDate(analysis.date);
    resetFormValues();
    setIsEditing(false);
  };

  const resetFormValues = () => {
    if (!analysis) return;

    const resetValues: Record<string, LabValue> = {};
    const resetRawInputs: Record<string, string> = {};
    const resetActiveMetrics: Record<string, boolean> = {};

    LAB_VALUE_KEYS.forEach((key) => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const value = (analysis as any)[key] as LabValue | undefined;
      const isActive = isLabValueActive(value);

      resetActiveMetrics[key] = isActive;

      if (isActive && value) {
        resetValues[key] = { ...value };
        resetRawInputs[key] =
          value.value != null ? value.value.toString() : "0";
      } else {
        resetValues[key] = initializeLabValueWithDefaults(key);
        resetRawInputs[key] = "";
      }
    });

    setEditedValues(resetValues);
    setRawInputs(resetRawInputs);
    setActiveMetrics(resetActiveMetrics);
  };

  const handleInputFocus = (key: string) => {
    const yOffset = LAB_VALUE_KEYS.indexOf(key) * 150;

    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, yOffset - 100),
          animated: true,
        });
      }
    }, 300);
  };

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={loadAnalysis} />;
  }

  if (!analysis) {
    return <AnalysisNotFoundView onGoBack={() => navigation.goBack()} />;
  }

  const formattedDate = isEditing
    ? editedDate.toLocaleDateString("fr-FR")
    : analysis.date.toLocaleDateString("fr-FR");

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Analysis Details</Text>

            {successMessage && (
              <View style={styles.successMessageContainer}>
                <Text style={styles.successMessageText}>{successMessage}</Text>
              </View>
            )}

            {isEditing ? (
              <DatePickerSection
                formattedDate={formattedDate}
                showPicker={showDatePicker}
                setShowPicker={setShowDatePicker}
                editedDate={editedDate}
                setEditedDate={setEditedDate}
              />
            ) : (
              <Text style={styles.date}>{formattedDate}</Text>
            )}

            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>Edit Values</Text>
              </TouchableOpacity>
            ) : (
              <EditActionButtons
                onCancel={cancelEditing}
                onSave={saveChanges}
                isSaving={saving}
              />
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            {Object.entries(LAB_VALUE_CATEGORIES).map(([category, labKeys]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeaderTitle}>{category}</Text>
                  <View style={styles.sectionHeaderLine} />
                </View>
                {labKeys.map((key) => renderLabValueField(key))}
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );

  function renderLabValueField(key: string) {
    const displayValue = isEditing
      ? editedValues[key]
      : /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ((analysis as any)[key] as LabValue | undefined);

    const isActive = isEditing
      ? activeMetrics[key]
      : displayValue !== undefined && displayValue !== null;

    const refRange = LAB_VALUE_REFERENCE_RANGES[key];
    const isOutOfRange =
      isActive &&
      displayValue &&
      refRange &&
      displayValue.value != null &&
      (displayValue.value < refRange.min || displayValue.value > refRange.max);

    return (
      <View
        key={key}
        style={[
          styles.labValueContainer,
          isOutOfRange ? styles.outOfRange : null,
        ]}
      >
        <View style={styles.labHeaderRow}>
          <Text style={styles.labValueName}>{key}</Text>

          {isEditing && (
            <Switch
              value={activeMetrics[key]}
              onValueChange={(value) => handleMetricToggle(key, value)}
              trackColor={{ false: "#e3ebf6", true: "#c6e9d9" }}
              thumbColor={activeMetrics[key] ? "#00d97e" : "#95aac9"}
              style={{ marginBottom: 10 }}
            />
          )}
        </View>

        {!isEditing && !isActive ? (
          <Text style={styles.notAvailableText}>Non disponible</Text>
        ) : (
          <View>
            <View style={styles.valueRow}>
              {isEditing && isActive ? (
                <View style={styles.valueRow}>
                  <DecimalInput
                    value={rawInputs[key] || "0"}
                    onChangeText={(text) => handleValueChange(key, text)}
                    onFocus={() => {
                      handleInputFocus(key);
                    }}
                  />
                  <TextInput
                    style={styles.unitInput}
                    value={displayValue?.unit || LAB_VALUE_UNITS[key] || ""}
                    onChangeText={(text) => handleUnitChange(key, text)}
                    onFocus={() => {
                      handleInputFocus(key);
                    }}
                  />
                  <View style={{ width: 10 }} />
                </View>
              ) : isActive && displayValue ? (
                <Text
                  style={[
                    styles.labValueText,
                    isOutOfRange ? styles.outOfRangeText : null,
                  ]}
                >
                  {displayValue.value != null
                    ? displayValue.value.toFixed(2)
                    : "0.00"}{" "}
                  {displayValue.unit || LAB_VALUE_UNITS[key] || ""}
                </Text>
              ) : null}
            </View>

            {refRange && (
              <Text style={styles.referenceRange}>
                Normal range: {refRange.min} - {refRange.max}{" "}
                {LAB_VALUE_UNITS[key] || ""}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }
};

const LoadingView = () => (
  <ScreenLayout>
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c7be5" />
      <Text style={styles.loadingText}>Loading analysis details...</Text>
    </View>
  </ScreenLayout>
);

const ErrorView = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <ScreenLayout>
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  </ScreenLayout>
);

const AnalysisNotFoundView = ({ onGoBack }: { onGoBack: () => void }) => (
  <ScreenLayout>
    <View style={styles.centered}>
      <Text style={styles.errorText}>Analysis not found</Text>
      <TouchableOpacity style={styles.button} onPress={onGoBack}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </ScreenLayout>
);

const DatePickerSection = ({
  formattedDate,
  showPicker,
  setShowPicker,
  editedDate,
  setEditedDate,
}: {
  formattedDate: string;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
  editedDate: Date;
  setEditedDate: (date: Date) => void;
}) => (
  <View>
    <TouchableOpacity
      style={styles.dateEditButton}
      onPress={() => setShowPicker(true)}
    >
      <View style={styles.editableDateContainer}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color="#2c7be5"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>

    {showPicker && (
      <View style={styles.datePickerContainer}>
        <DateTimePicker
          testID="dateTimePicker"
          value={editedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || editedDate;
            setShowPicker(Platform.OS === "ios");
            setEditedDate(currentDate);
          }}
          style={styles.datePicker}
        />
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.iosCloseButton}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.iosCloseButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
);

const EditActionButtons = ({
  onCancel,
  onSave,
  isSaving,
}: {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}) => (
  <View style={styles.editActions}>
    <TouchableOpacity
      style={[styles.actionButton, styles.cancelButton]}
      onPress={onCancel}
      disabled={isSaving}
    >
      <Text style={styles.actionButtonText}>Cancel</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.actionButton, styles.saveButton]}
      onPress={onSave}
      disabled={isSaving}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.actionButtonText}>Save</Text>
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ebf6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#12263f",
  },
  date: {
    fontSize: 16,
    color: "#95aac9",
    marginTop: 4,
  },
  dateEditButton: {
    marginTop: 6,
    marginBottom: 8,
  },
  editableDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f4f8",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  editDateText: {
    fontSize: 12,
    color: "#2c7be5",
    marginLeft: 4,
    textDecorationLine: "underline",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  spacer: {
    height: 100,
  },
  labValueContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  outOfRange: {
    borderLeftWidth: 4,
    borderLeftColor: "#e63757",
  },
  labValueName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  decimalInputContainer: {
    flex: 1,
    flexDirection: "row",
    marginRight: 8,
  },
  decimalButton: {
    width: 30,
    height: 40,
    backgroundColor: "#2c7be5",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  decimalButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  labValueText: {
    fontSize: 18,
    color: "#2c7be5",
  },
  outOfRangeText: {
    color: "#e63757",
  },
  referenceRange: {
    fontSize: 12,
    color: "#95aac9",
    marginTop: 8,
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
  errorText: {
    fontSize: 18,
    color: "#e63757",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2c7be5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#2c7be5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  editActions: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "#95aac9",
  },
  saveButton: {
    backgroundColor: "#00d97e",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  valueInput: {
    flex: 1,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#e3ebf6",
    borderRadius: 4,
    padding: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  unitInput: {
    width: 80,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#e3ebf6",
    borderRadius: 4,
    padding: 8,
  },
  datePickerContainer: {
    marginVertical: 10,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePicker: {
    width: "100%",
    height: 200,
  },
  iosCloseButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: "#2c7be5",
  },
  iosCloseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  labHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  notAvailableText: {
    fontSize: 14,
    color: "#95aac9",
  },
  successMessageContainer: {
    backgroundColor: "rgba(0, 217, 126, 0.1)",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: "stretch",
  },
  successMessageText: {
    color: "#00d97e",
    fontSize: 14,
    textAlign: "center",
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#12263f",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionHeaderLine: {
    height: 3,
    width: 80,
    backgroundColor: "#2c7be5",
    borderRadius: 3,
  },
});

export default AnalysisDetailsScreen;
