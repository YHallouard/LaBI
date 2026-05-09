import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  LAB_VALUE_CATEGORIES,
  LAB_VALUE_UNITS,
} from "../../config/LabConfig";
import { CreateManualAnalysisUseCase } from "../../application/usecases/CreateManualAnalysisUseCase";
import { ReferenceRangeService } from "../../application/services/ReferenceRangeService";

type LabEntry = {
  enabled: boolean;
  value: string;
  unit: string;
};

type LabState = Record<string, LabEntry>;

function buildInitialLabState(): LabState {
  const state: LabState = {};
  Object.values(LAB_VALUE_CATEGORIES)
    .flat()
    .forEach((labKey) => {
      state[labKey] = {
        enabled: false,
        value: "",
        unit: LAB_VALUE_UNITS[labKey] ?? "",
      };
    });
  return state;
}

type ManualImportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  createManualAnalysisUseCase: CreateManualAnalysisUseCase;
  referenceRangeService: ReferenceRangeService;
};

export const ManualImportModal: React.FC<ManualImportModalProps> = ({
  visible,
  onClose,
  onSaved,
  createManualAnalysisUseCase,
  referenceRangeService,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [labState, setLabState] = useState<LabState>(buildInitialLabState);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const reset = useCallback(() => {
    setSelectedDate(new Date());
    setShowDatePicker(false);
    setLabState(buildInitialLabState());
    setIsSaving(false);
    setErrors({});
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasEnabledValues = (): boolean =>
    Object.values(labState).some((e) => e.enabled);

  const toggleLab = (labKey: string, value: boolean) => {
    setLabState((prev) => ({
      ...prev,
      [labKey]: { ...prev[labKey], enabled: value },
    }));
  };

  const updateValue = (labKey: string, text: string) => {
    setLabState((prev) => ({
      ...prev,
      [labKey]: { ...prev[labKey], value: text },
    }));
    if (errors[labKey]) {
      setErrors((prev) => ({ ...prev, [labKey]: false }));
    }
  };

  const isOutOfRange = (labKey: string): boolean => {
    const entry = labState[labKey];
    if (!entry.enabled || !entry.value) return false;
    const num = parseFloat(entry.value);
    if (isNaN(num)) return false;
    const range = referenceRangeService.getReferenceRange(labKey, selectedDate);
    return num < range.min || num > range.max;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    let valid = true;

    Object.entries(labState).forEach(([labKey, entry]) => {
      if (entry.enabled) {
        if (!entry.value || isNaN(parseFloat(entry.value))) {
          newErrors[labKey] = true;
          valid = false;
        }
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!hasEnabledValues()) {
      Alert.alert(
        "Aucune valeur",
        "Activez au moins un biomarqueur avant de sauvegarder."
      );
      return;
    }

    if (!validate()) {
      Alert.alert(
        "Valeurs invalides",
        "Certaines valeurs saisies ne sont pas valides."
      );
      return;
    }

    setIsSaving(true);
    try {
      const values: Record<string, { value: number; unit: string }> = {};
      Object.entries(labState).forEach(([labKey, entry]) => {
        if (entry.enabled && entry.value) {
          values[labKey] = {
            value: parseFloat(entry.value),
            unit: entry.unit,
          };
        }
      });

      await createManualAnalysisUseCase.execute({
        date: selectedDate,
        values,
      });

      reset();
      onSaved();
      onClose();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer l'analyse.");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = selectedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Saisir manuellement</Text>

          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              (!hasEnabledValues() || isSaving) && styles.saveButtonDisabled,
            ]}
            disabled={!hasEnabledValues() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Date picker row */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2c7be5" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {/* Categories */}
          {Object.entries(LAB_VALUE_CATEGORIES).map(([category, labKeys]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.categoryUnderline} />

              {labKeys.map((labKey) => {
                const entry = labState[labKey];
                const range = referenceRangeService.getReferenceRange(
                  labKey,
                  selectedDate
                );
                const outOfRange = isOutOfRange(labKey);
                const hasError = errors[labKey];

                return (
                  <View key={labKey} style={styles.labRow}>
                    <View style={styles.labHeader}>
                      <Text style={styles.labName}>{labKey}</Text>
                      <Switch
                        value={entry.enabled}
                        onValueChange={(v) => toggleLab(labKey, v)}
                        trackColor={{ false: "#d1d5db", true: "#00d97e" }}
                        thumbColor="white"
                      />
                    </View>

                    {entry.enabled ? (
                      <>
                        <View
                          style={[
                            styles.inputRow,
                            (outOfRange || hasError) && styles.inputRowError,
                          ]}
                        >
                          <TextInput
                            style={styles.valueInput}
                            value={entry.value}
                            onChangeText={(t) => updateValue(labKey, t)}
                            keyboardType="decimal-pad"
                            placeholder="0.0"
                            placeholderTextColor="#95aac9"
                          />
                          <Text style={styles.unitText}>{entry.unit}</Text>
                        </View>

                        {hasError && (
                          <Text style={styles.errorText}>
                            Valeur invalide
                          </Text>
                        )}

                        {outOfRange && !hasError && (
                          <Text style={styles.outOfRangeText}>
                            Hors norme
                          </Text>
                        )}

                        <Text style={styles.rangeText}>
                          Plage normale : {range.min.toFixed(2)} –{" "}
                          {range.max.toFixed(2)} {entry.unit}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.notAvailableText}>
                        Non disponible
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  headerButton: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12263f",
    flex: 1,
    textAlign: "center",
  },
  cancelText: {
    fontSize: 15,
    color: "#5a7184",
  },
  saveButton: {
    backgroundColor: "#00a86b",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#95aac9",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  dateText: {
    fontSize: 15,
    color: "#12263f",
    fontWeight: "500",
  },
  categorySection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12263f",
    marginBottom: 4,
  },
  categoryUnderline: {
    height: 2,
    width: 40,
    backgroundColor: "#2c7be5",
    borderRadius: 1,
    marginBottom: 12,
  },
  labRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  labHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#12263f",
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
    marginBottom: 4,
  },
  inputRowError: {
    borderColor: "#e63757",
    backgroundColor: "rgba(230, 55, 87, 0.05)",
  },
  valueInput: {
    flex: 1,
    fontSize: 15,
    color: "#12263f",
    paddingVertical: 2,
  },
  unitText: {
    fontSize: 14,
    color: "#5a7184",
    marginLeft: 8,
  },
  rangeText: {
    fontSize: 12,
    color: "#5a7184",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#e63757",
    marginTop: 2,
    marginBottom: 2,
  },
  outOfRangeText: {
    fontSize: 12,
    color: "#e63757",
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 2,
  },
  notAvailableText: {
    fontSize: 13,
    color: "#95aac9",
    fontStyle: "italic",
  },
  bottomPad: {
    height: 40,
  },
});
