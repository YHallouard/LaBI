import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { GetAnalysesUseCase } from "../../application/usecases/GetAnalysesUseCase";
import { DeleteAnalysisUseCase } from "../../application/usecases/DeleteAnalysisUseCase";
import { AnalysisCard } from "../components/AnalysisCard";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";
import { EmptyState } from "../components/EmptyState";

type HomeScreenProps = {
  getAnalysesUseCase: GetAnalysesUseCase;
  deleteAnalysisUseCase: DeleteAnalysisUseCase;
  navigation: StackNavigationProp<HomeStackParamList, "HomeScreen">;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  getAnalysesUseCase,
  deleteAnalysisUseCase,
}) => {
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    // Profile check is now handled by ProfileRequiredModal at the app level
    // No need to redirect to profile creation here
    loadAnalyses();
  }, []);

  const loadAnalyses = async (refresh: boolean = false): Promise<void> => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (!isRefreshing) {
      setLoading(true);
    }

    try {
      const result = await getAnalysesUseCase.execute();
      const sortedAnalyses = sortAnalysesByDateDescending(result);
      setAnalyses(sortedAnalyses);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to load analyses");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const sortAnalysesByDateDescending = (
    analyses: BiologicalAnalysis[]
  ): BiologicalAnalysis[] => {
    return [...analyses].sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const onRefresh = (): void => {
    loadAnalyses(true);
  };

  const navigateToAnalysisDetails = (analysis: BiologicalAnalysis): void => {
    navigation.navigate("AnalysisDetails", { analysisId: analysis.id });
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      await deleteAnalysisUseCase.execute(analysisId);
      removeAnalysisFromList(analysisId);
      closeSwipeableItem(analysisId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert("Error", "Failed to delete analysis");
    }
  };

  const removeAnalysisFromList = (analysisId: string): void => {
    setAnalyses((prevAnalyses) =>
      prevAnalyses.filter((analysis) => analysis.id !== analysisId)
    );
  };

  const closeSwipeableItem = (itemId: string): void => {
    if (swipeableRefs.current[itemId]) {
      swipeableRefs.current[itemId].close();
    }
  };

  const confirmDelete = (analysisId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this analysis?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAnalysis(analysisId),
        },
      ]
    );
  };

  const closeAllSwipeableItems = (currentId?: string) => {
    Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
      if (currentId !== id && ref) {
        ref.close();
      }
    });
  };

  const renderDeleteButton = (analysisId: string) => {
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            confirmDelete(analysisId);
            closeSwipeableItem(analysisId);
          }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnalysisItem = ({ item }: { item: BiologicalAnalysis }) => {
    return (
      <Swipeable
        renderRightActions={() => renderDeleteButton(item.id)}
        onSwipeableOpen={() => closeAllSwipeableItems(item.id)}
        ref={(ref) => {
          if (ref) swipeableRefs.current[item.id] = ref;
        }}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        <AnalysisCard
          analysis={item}
          onPress={() => {
            closeSwipeableItem(item.id);
            navigateToAnalysisDetails(item);
          }}
        />
      </Swipeable>
    );
  };

  if (loading && !isRefreshing) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
          <Text style={styles.loadingText}>Loading your analyses...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error && !isRefreshing) {
    return (
      <ScreenLayout scrollable={false}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={60} color="#e63757" />
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

  if (analyses.length === 0 && !isRefreshing) {
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
    <ScreenLayout scrollable={false}>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={renderAnalysisItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#2c7be5"]}
            tintColor="#2c7be5"
            title="Pull to refresh..."
            titleColor="#95aac9"
          />
        }
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#e63757",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2c7be5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    color: "#95aac9",
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: "#e63757",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rightActionsContainer: {
    width: 80,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
});
