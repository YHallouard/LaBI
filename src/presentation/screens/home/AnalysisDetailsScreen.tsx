import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import { HomeStackParamList } from "../../../types/navigation";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../../domain/entities/BiologicalAnalysis";
import { GetAnalysisByIdUseCase } from "../../../domain/usecases/GetAnalysesUseCase";
import { UpdateAnalysisUseCase } from "../../../domain/usecases/UpdateAnalysisUseCase";
import { DeleteAnalysisUseCase } from "../../../domain/usecases/DeleteAnalysisUseCase";
import {
  LAB_VALUE_UNITS,
  LAB_VALUE_CATEGORIES,
} from "../../../config/LabConfig";
import { GetReferenceRangeUseCase } from "../../../domain/usecases/GetReferenceRangeUseCase";
import { ScreenLayout, ResponsiveSectionList } from "../../components";
import { TabBarActionButton } from "../../components/TabBarActionButton";
import { useTabBar } from "../../contexts/TabBarContext";
import { AnalysisEditModal } from "../../components/AnalysisEditModal";
import { colorPalette, generateAlpha } from "../../../config/themes";

// Define the props type for the AnalysisDetails screen
interface AnalysisDetailsScreenProps
  extends StackScreenProps<HomeStackParamList, "AnalysisDetails"> {
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase;
  updateAnalysisUseCase: UpdateAnalysisUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
}

const AnalysisDetailsScreen: React.FC<AnalysisDetailsScreenProps> = ({
  route,
  navigation,
  getAnalysisByIdUseCase,
  updateAnalysisUseCase,
  deleteAnalysisUseCase,
  getReferenceRangeUseCase,
}) => {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

  const { setLeftButtons, setRightButtons, clearButtons } = useTabBar();

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAnalysisByIdUseCase.execute(analysisId);
      setAnalysis(result);
      setError(null);
    } catch (err) {
      console.error("Failed to load analysis:", err);
      setError("Failed to load analysis details");
    } finally {
      setLoading(false);
    }
  }, [analysisId, getAnalysisByIdUseCase]);

  const deleteAnalysis = useCallback(async (): Promise<void> => {
    if (!analysis) return;

    Alert.alert(
      "Delete Analysis",
      "Are you sure you want to delete this analysis? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAnalysisUseCase.execute(analysisId);
              navigation.goBack();
            } catch {
              Alert.alert("Error", "Failed to delete analysis");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [analysis, analysisId, deleteAnalysisUseCase, navigation]);

  const openEditModal = useCallback((): void => {
    setEditModalVisible(true);
  }, []);

  const handleAnalysisUpdated = useCallback(
    (updatedAnalysis: BiologicalAnalysis) => {
      setAnalysis(updatedAnalysis);
      setSuccessMessage("Analysis updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    []
  );

  const deleteButton = useMemo(
    () => (
      <TabBarActionButton
        key="delete"
        iconName="trash-outline"
        onPress={deleteAnalysis}
        loading={deleting}
        backgroundColor={colorPalette.neutral.white}
        iconColor={colorPalette.primary.main}
      />
    ),
    [deleteAnalysis, deleting]
  );

  const editButton = useMemo(
    () => (
      <TabBarActionButton
        key="edit"
        iconName="create-outline"
        onPress={openEditModal}
        backgroundColor={colorPalette.primary.main}
        disabled={deleting}
      />
    ),
    [openEditModal, deleting]
  );

  useFocusEffect(
    useCallback(() => {
      if (analysis && !loading && !error) {
        setLeftButtons([deleteButton]);
        setRightButtons([editButton]);
      }

      return () => {
        clearButtons();
      };
    }, [
      analysis,
      loading,
      error,
      deleteButton,
      editButton,
      setLeftButtons,
      setRightButtons,
      clearButtons,
    ])
  );

  useEffect(() => {
    async function initializeAndLoad() {
      try {
        await getReferenceRangeUseCase.initialize();
        await loadAnalysis();
      } catch (error) {
        console.error("Failed to initialize services:", error);
        setError("Failed to initialize application");
      }
    }

    initializeAndLoad();
  }, [analysisId, loadAnalysis]);

  const isLabValueActive = (value: LabValue | undefined): boolean => {
    return (
      value !== undefined &&
      value !== null &&
      typeof value.value === "number" &&
      !isNaN(value.value)
    );
  };

  const getReferenceRange = (labKey: string) => {
    if (!analysis) return { min: 0, max: 0 };
    return getReferenceRangeUseCase.execute(labKey, analysis.date);
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
    (labKey: string) => {
      const displayValue = (analysis as Record<string, LabValue | undefined>)[
        labKey
      ];
      const isActive = isLabValueActive(displayValue);
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
          </View>

          {!isActive ? (
            <Text style={styles.notAvailableText}>Non disponible</Text>
          ) : (
            <View>
              <Text
                style={[
                  styles.labValueText,
                  isOutOfRange ? styles.outOfRangeText : null,
                ]}
              >
                {displayValue?.value != null
                  ? displayValue.value.toFixed(2)
                  : "0.00"}{" "}
                {displayValue?.unit || LAB_VALUE_UNITS[labKey] || ""}
              </Text>

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
    [analysis]
  );

  const sections = useMemo(
    () =>
      Object.entries(LAB_VALUE_CATEGORIES).map(([category, labKeys]) => ({
        title: category,
        data: labKeys,
      })),
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const keyExtractor = useCallback(
    (labKey: string, index: number) => labKey,
    []
  );

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={loadAnalysis} />;
  }

  if (!analysis) {
    return <AnalysisNotFoundView onGoBack={() => navigation.goBack()} />;
  }

  const formattedDate = analysis.date.toLocaleDateString("fr-FR");

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Details</Text>

          {successMessage && (
            <View style={styles.successMessageContainer}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          <Text style={styles.date}>{formattedDate}</Text>
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

        <AnalysisEditModal
          visible={editModalVisible}
          analysis={analysis}
          updateAnalysisUseCase={updateAnalysisUseCase}
          getReferenceRangeUseCase={getReferenceRangeUseCase}
          onClose={() => setEditModalVisible(false)}
          onSave={handleAnalysisUpdated}
        />
      </View>
    </ScreenLayout>
  );
};

const LoadingView = () => (
  <ScreenLayout>
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colorPalette.primary.main} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colorPalette.neutral.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral.lighter,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
  },
  date: {
    fontSize: 16,
    color: colorPalette.neutral.light,
    marginTop: 4,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 0,
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
  labValueName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    marginBottom: 8,
  },
  labValueText: {
    fontSize: 18,
    color: colorPalette.primary.main,
  },
  outOfRangeText: {
    color: colorPalette.feedback.error,
  },
  referenceRange: {
    fontSize: 12,
    color: colorPalette.neutral.light,
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
    color: colorPalette.neutral.main,
  },
  errorText: {
    fontSize: 18,
    color: colorPalette.feedback.error,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: colorPalette.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: colorPalette.neutral.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  successMessageContainer: {
    backgroundColor: generateAlpha(colorPalette.feedback.success, 0.1),
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: "stretch",
  },
  successMessageText: {
    color: colorPalette.feedback.success,
    fontSize: 14,
    textAlign: "center",
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
  labHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notAvailableText: {
    fontSize: 14,
    color: colorPalette.neutral.light,
  },
});

export default AnalysisDetailsScreen;
