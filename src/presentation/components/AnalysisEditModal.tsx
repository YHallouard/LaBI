import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import {
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
  LAB_VALUE_CATEGORIES,
} from "../../config/LabConfig";
import { GetReferenceRangeUseCase } from "../../domain/usecases/GetReferenceRangeUseCase";
import { ResponsiveSectionList } from ".";
import { colorPalette } from "../../config/themes";

interface AnalysisEditModalProps {
  visible: boolean;
  analysis: BiologicalAnalysis;
  title?: string;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
  onSave: (analysis: BiologicalAnalysis) => Promise<void>;
  onSaved?: (analysis: BiologicalAnalysis) => void;
  onClose: () => void;
}

const DecimalInput = ({
  value,
  onChangeText,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = (text: string) => {
    const normalizedText = text.replace(",", ".");

    if (/^-?\d*\.?\d*$/.test(normalizedText) || normalizedText === "") {
      onChangeText(normalizedText);
    }
  };

  const handleBlur = () => {
    if (value === "") {
      onChangeText("0");
    }
  };

  return (
    <TextInput
      ref={inputRef}
      style={[styles.valueInput, style]}
      value={value}
      onChangeText={handleTextChange}
      onBlur={handleBlur}
      keyboardType="decimal-pad"
    />
  );
};

export const AnalysisEditModal: React.FC<AnalysisEditModalProps> = ({
  visible,
  analysis,
  title = "Edit Analysis",
  getReferenceRangeUseCase,
  onSave,
  onSaved,
  onClose,
}) => {
  const [editedValues, setEditedValues] = useState<Record<string, LabValue>>(
    {}
  );
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>(
    {}
  );
  const [editedDate, setEditedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  React.useEffect(() => {
    if (visible && analysis) {
      initializeFormValues(analysis);
    }
  }, [visible, analysis]);

  const initializeLabValueWithDefaults = (key: string): LabValue => {
    return {
      value: 0,
      unit: LAB_VALUE_UNITS[key] || "",
    };
  };

  const isLabValueActive = (value: LabValue | undefined): boolean => {
    return (
      value !== undefined &&
      value !== null &&
      typeof value.value === "number" &&
      !isNaN(value.value)
    );
  };

  const initializeFormValues = useCallback((result: BiologicalAnalysis) => {
    const initialValues: Record<string, LabValue> = {};
    const initialRawInputs: Record<string, string> = {};
    const initialActiveMetrics: Record<string, boolean> = {};

    setEditedDate(result.date);

    LAB_VALUE_KEYS.forEach((key) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const value = (result as any)[key] as LabValue | undefined;
      const isActive = isLabValueActive(value);

      initialActiveMetrics[key] = isActive;

      if (isActive && value) {
        initialValues[key] = { ...value };
        initialRawInputs[key] =
          value.value != null ? value.value.toString() : "";
      } else {
        initialValues[key] = initializeLabValueWithDefaults(key);
        initialRawInputs[key] = "";
      }
    });

    setEditedValues(initialValues);
    setRawInputs(initialRawInputs);
    setActiveMetrics(initialActiveMetrics);
  }, []);

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
      setRawInputs((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const getReferenceRange = (labKey: string) => {
    if (!analysis) return { min: 0, max: 0 };
    return getReferenceRangeUseCase.execute(labKey, editedDate);
  };

  const createUpdatedAnalysis = (): BiologicalAnalysis => {
    const updatedAnalysis: BiologicalAnalysis = {
      ...(analysis as BiologicalAnalysis),
      date: editedDate,
    };

    LAB_VALUE_KEYS.forEach((key) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (activeMetrics[key]) {
        (updatedAnalysis as any)[key] = editedValues[key];
      } else {
        (updatedAnalysis as any)[key] = null;
      }
    });

    return updatedAnalysis;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedAnalysis = createUpdatedAnalysis();
      await onSave(updatedAnalysis);
      onSaved?.(updatedAnalysis);
      onClose();
    } catch (err) {
      console.error("Failed to save changes:", err);
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const renderSectionHeader = useCallback(
    (title: string) => (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <View style={styles.sectionHeaderLine} />
      </View>
    ),
    []
  );

  const renderLabValueItem = useCallback(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    (labKey: string, index: number, isLargeScreen: boolean) => {
      const displayValue = editedValues[labKey];
      const isActive = activeMetrics[labKey];
      const refRange = getReferenceRange(labKey);
      const isOutOfRange =
        isActive &&
        displayValue &&
        refRange &&
        displayValue.value != null &&
        (displayValue.value < refRange.min ||
          displayValue.value > refRange.max);

      return (
        <View
          style={[
            styles.labValueContainer,
            isOutOfRange ? styles.outOfRange : null,
          ]}
        >
          <View style={styles.labHeaderRow}>
            <Text style={styles.labValueName}>{labKey}</Text>
            <Switch
              value={activeMetrics[labKey]}
              onValueChange={(value) => handleMetricToggle(labKey, value)}
              trackColor={{
                false: colorPalette.neutral.lighter,
                true: "#c6e9d9",
              }}
              thumbColor={
                activeMetrics[labKey]
                  ? colorPalette.feedback.success
                  : colorPalette.neutral.light
              }
            />
          </View>

          {!isActive ? (
            <Text style={styles.notAvailableText}>Non disponible</Text>
          ) : (
            <View>
              <View style={styles.valueRow}>
                <DecimalInput
                  value={rawInputs[labKey] || ""}
                  onChangeText={(text) => handleValueChange(labKey, text)}
                  style={styles.decimalInput}
                />
                <TextInput
                  style={styles.unitInput}
                  value={displayValue?.unit || LAB_VALUE_UNITS[labKey] || ""}
                  onChangeText={(text) => handleUnitChange(labKey, text)}
                />
              </View>

              {refRange && (
                <Text style={styles.referenceRange}>
                  Normal range: {refRange.min.toFixed(2)} -{" "}
                  {refRange.max.toFixed(2)} {LAB_VALUE_UNITS[labKey] || ""}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    },
    [editedValues, activeMetrics, rawInputs, editedDate]
  );

  const sections = useMemo(
    () =>
      Object.entries(LAB_VALUE_CATEGORIES).map(([category, labKeys]) => ({
        title: category,
        data: labKeys,
      })),
    []
  );

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const keyExtractor = useCallback(
    (labKey: string, index: number) => labKey,
    []
  );

  const formattedDate = editedDate.toLocaleDateString("fr-FR");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.disabledButton]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={colorPalette.neutral.white}
              />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dateSection}>
          <TouchableOpacity
            style={styles.dateEditButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.editableDateContainer}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colorPalette.primary.main}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                testID="dateTimePicker"
                value={editedDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || editedDate;
                  setShowDatePicker(Platform.OS === "ios");
                  setEditedDate(currentDate);
                }}
                style={styles.datePicker}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.iosCloseButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.iosCloseButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <ResponsiveSectionList
          sections={sections}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderLabValueItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.scrollViewContent}
          maxColumns={3}
          thresholds={{ twoColumns: 1000, threeColumns: 1400 }}
          showsVerticalScrollIndicator={true}
          stickySectionHeadersEnabled={false}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colorPalette.neutral.background,
  },
  header: {
    backgroundColor: colorPalette.neutral.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral.lighter,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colorPalette.neutral.light,
  },
  saveButton: {
    backgroundColor: colorPalette.feedback.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonText: {
    color: colorPalette.neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  dateSection: {
    backgroundColor: colorPalette.neutral.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral.lighter,
  },
  dateEditButton: {
    marginBottom: 8,
  },
  editableDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  date: {
    fontSize: 16,
    color: colorPalette.neutral.main,
  },
  datePickerContainer: {
    marginVertical: 10,
    backgroundColor: colorPalette.neutral.white,
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
    backgroundColor: colorPalette.primary.main,
  },
  iosCloseButtonText: {
    color: colorPalette.neutral.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeaderContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionHeaderLine: {
    height: 3,
    width: 80,
    backgroundColor: colorPalette.primary.main,
    borderRadius: 3,
  },
  labValueContainer: {
    flex: 1,
    backgroundColor: colorPalette.neutral.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 120,
  },
  outOfRange: {
    borderLeftWidth: 4,
    borderLeftColor: colorPalette.feedback.error,
  },
  labHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  labValueName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    flex: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  decimalInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
  },
  valueInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
    borderRadius: 4,
    padding: 8,
  },
  unitInput: {
    width: 80,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
    borderRadius: 4,
    padding: 8,
  },
  referenceRange: {
    fontSize: 12,
    color: colorPalette.neutral.light,
    marginTop: 4,
  },
  notAvailableText: {
    fontSize: 14,
    color: colorPalette.neutral.light,
  },
});
