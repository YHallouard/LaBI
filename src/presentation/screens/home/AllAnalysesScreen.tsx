import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { GetAnalysesUseCase } from "../../../domain/usecases/GetAnalysesUseCase";
import { DeleteAnalysisUseCase } from "../../../domain/usecases/DeleteAnalysisUseCase";
import { AnalysisCard } from "../../components/AnalysisCard";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../../components/ScreenLayout";
import { EmptyState } from "../../components/EmptyState";
import { colorPalette } from "../../../config/themes";

type AllAnalysesScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  navigation: StackNavigationProp<HomeStackParamList, "AllAnalysesScreen">;
};

export const AllAnalysesScreen: React.FC<AllAnalysesScreenProps> = ({
  navigation,
  getAnalysesUseCase,
}) => {
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Toutes les Analyses",
    });
    if (getAnalysesUseCase) {
      loadAnalyses();
    }
  }, [getAnalysesUseCase, navigation]);

  const loadAnalyses = async (isRefresh: boolean = false): Promise<void> => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const result = await getAnalysesUseCase.execute("desc");
      setAnalyses(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load analyses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadAnalyses(true);
  };

  const navigateToAnalysisDetails = (analysis: BiologicalAnalysis): void => {
    navigation.navigate("AnalysisDetails", { analysisId: analysis.id });
  };

  const renderAnalysisItem = ({ item }: { item: BiologicalAnalysis }) => {
    return (
      <AnalysisCard
        analysis={item}
        onPress={() => navigateToAnalysisDetails(item)}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colorPalette.primary.main} />
          <Text style={styles.loadingText}>Loading your analyses...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error && !refreshing) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={colorPalette.feedback.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadAnalyses(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  if (analyses.length === 0 && !refreshing) {
    return (
      <ScreenLayout scrollable={false}>
        <EmptyState
          navigation={navigation}
          message="No analyses found"
          subMessage="Upload a report to get started"
          iconName="file-tray-outline"
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scrollable={false} style={styles.layout}>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={renderAnalysisItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colorPalette.primary.main]}
            tintColor={colorPalette.primary.main}
            title="Pull to refresh..."
            titleColor={colorPalette.neutral.light}
          />
        }
        showsVerticalScrollIndicator={true}
        ListFooterComponent={() => <View style={styles.bottomSpacer} />}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  layout: {
    paddingTop: 0,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colorPalette.feedback.error,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colorPalette.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: colorPalette.neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    color: colorPalette.neutral.light,
    marginTop: 16,
  },
  bottomSpacer: {
    height: 110,
  },
});
