import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScaledSize,
  RefreshControl,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette, glass } from "../../../config/themes";
import { HemeaLogo } from "../../components/HemeaLogo";
import { PinnedItemsModal } from "../../components/PinnedItemsModal";
import {
  GetAnalysesUseCase,
  GetLabTestDataUseCase,
  DataPoint,
} from "../../../domain/usecases/GetAnalysesUseCase";
import { CalculateStatisticsUseCase } from "../../../domain/usecases/CalculateStatisticsUseCase";
import { GetReferenceRangeUseCase } from "../../../domain/usecases/GetReferenceRangeUseCase";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { ChartItem } from "../charts/ChartScreen";
import { LAB_VALUE_UNITS } from "../../../config/LabConfig";
import { GetPinnedMetricsUseCase } from "../../../domain/usecases/GetPinnedMetricsUseCase";
import { SavePinnedMetricsUseCase } from "../../../domain/usecases/SavePinnedMetricsUseCase";
import {
  CalculateHealthMagnitudeUseCase,
  HealthMagnitudeDataPoint,
} from "../../../domain/usecases/CalculateHealthMagnitudeUseCase";
import HealthMagnitudeChart from "../../components/HealthMagnitudeChart";
import { RetrieveUserProfileUseCase } from "../../../domain/usecases/RetrieveUserProfileUseCase";
import { GetUserAgeUseCase } from "../../../domain/usecases/GetUserAgeUseCase";
import { UserProfile } from "../../../domain/UserProfile";
import AvatarImage from "../../components/AvatarImage";
import { LinearGradient } from "expo-linear-gradient";
import { ZoomInWrapper } from "../../components/ZoomInWrapper";
import { useScrollAwareHeader } from "../../components/AppHeader";
import { GlassSurface } from "../../components/glass/GlassSurface";

type HomeScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "HomeScreen">;
  getAnalysesUseCase: GetAnalysesUseCase;
  getLabTestDataUseCase: GetLabTestDataUseCase;
  calculateStatisticsUseCase: CalculateStatisticsUseCase;
  getReferenceRangeUseCase: GetReferenceRangeUseCase;
  getPinnedMetricsUseCase: GetPinnedMetricsUseCase;
  savePinnedMetricsUseCase: SavePinnedMetricsUseCase;
  calculateHealthMagnitudeUseCase: CalculateHealthMagnitudeUseCase;
  retrieveUserProfileUseCase: RetrieveUserProfileUseCase;
  getUserAgeUseCase: GetUserAgeUseCase;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  getAnalysesUseCase,
  getLabTestDataUseCase,
  calculateStatisticsUseCase,
  getReferenceRangeUseCase,
  getPinnedMetricsUseCase,
  savePinnedMetricsUseCase,
  calculateHealthMagnitudeUseCase,
  retrieveUserProfileUseCase,
  getUserAgeUseCase,
}) => {
  const scrollY = useSharedValue(0);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [isModalVisible, setModalVisible] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [healthMagnitudeData, setHealthMagnitudeData] = useState<
    HealthMagnitudeDataPoint[]
  >([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [contentHeight, setContentHeight] = useState(
    Dimensions.get("window").height
  );
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  const isLargeScreen = screenWidth >= 1000;
  const largeHeaderHeight = isLargeScreen ? 220 : 100;
  const smallHeaderAppearsAt = largeHeaderHeight - 40;

  const { headerOpacityStyle, largeHeaderOpacityStyle, headerVisible } =
    useScrollAwareHeader(scrollY, smallHeaderAppearsAt);

  useAnimatedReaction(
    () => headerVisible.value,
    (visible) => {
      runOnJS(setIsHeaderVisible)(visible);
    }
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const navigateToSettings = useCallback(() => {
    navigation.navigate("SettingsScreen");
  }, [navigation]);

  // Set up scroll-aware header once at focus
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTransparent: true,
        headerTitleAlign: "center",
        headerBackground: () => (
          <Animated.View style={[StyleSheet.absoluteFill, headerOpacityStyle]}>
            {isHeaderVisible && (
              <GlassSurface
                intensity={glass.blur.chrome}
                tint="systemChromeMaterial"
                radius={0}
                overlayColor={glass.overlay.light}
                style={StyleSheet.absoluteFill}
              />
            )}
          </Animated.View>
        ),
        headerTitle: () => (
          <Animated.View style={headerOpacityStyle}>
            <HemeaLogo />
          </Animated.View>
        ),
        headerRight: () => (
          <Animated.View style={[headerOpacityStyle, { marginRight: 15 }]}>
            <TouchableOpacity onPress={navigateToSettings}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colorPalette.primary.main}
              />
            </TouchableOpacity>
          </Animated.View>
        ),
      });
    }, [navigation, headerOpacityStyle, navigateToSettings, isHeaderVisible])
  );

  const loadPinnedItems = useCallback(async () => {
    try {
      const items = await getPinnedMetricsUseCase.execute();
      if (items.length > 0) {
        setPinnedItems(items);
      } else {
        setPinnedItems(["Hémoglobine", "Leucocytes", "Plaquettes"]);
      }
    } catch {
      setPinnedItems(["Hémoglobine", "Leucocytes", "Plaquettes"]);
    }
  }, [getPinnedMetricsUseCase]);

  const loadAnalyses = useCallback(async () => {
    try {
      const result = await getAnalysesUseCase.execute("asc");
      setAnalyses(result);
    } catch (err) {
      console.error("Failed to load analyses on home screen", err);
    }
  }, [getAnalysesUseCase]);

  const loadHealthMagnitude = useCallback(async () => {
    try {
      const data = await calculateHealthMagnitudeUseCase.execute();
      setHealthMagnitudeData(data);
    } catch (error) {
      console.error("Failed to calculate health magnitude:", error);
    }
  }, [calculateHealthMagnitudeUseCase]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await retrieveUserProfileUseCase.execute();
      setUserProfile(profile);
      if (profile) {
        const age = getUserAgeUseCase.execute(profile);
        setUserAge(age);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }, [retrieveUserProfileUseCase, getUserAgeUseCase]);

  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadPinnedItems(),
      loadAnalyses(),
      loadHealthMagnitude(),
      loadUserProfile(),
    ]);
  }, [loadPinnedItems, loadAnalyses, loadHealthMagnitude, loadUserProfile]);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadAllData();
      setLoading(false);
      if (!hasAnimated) {
        setHasAnimated(true);
      }
    };
    initialLoad();
  }, [loadAllData, hasAnimated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  const navigateToAllAnalyses = () => {
    navigation.navigate("AllAnalysesScreen");
  };

  const getFilteredDataForLabKey = useCallback(
    (labKey: string): DataPoint[] => {
      if (analyses.length === 0) return [];
      const allData = getLabTestDataUseCase.execute(analyses, labKey);
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
      return allData.filter((point) => point.timestamp >= cutoffDate.getTime());
    },
    [analyses, getLabTestDataUseCase]
  );

  const formatDate = useCallback((date: Date): string => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
  }, []);

  const chartDimensions = useMemo(() => {
    const isLarge = screenWidth >= 1000;
    const availableWidth = screenWidth - (isLarge ? 40 : 32);
    const baseWidth = isLarge
      ? Math.min((availableWidth - 40) / 2, 500)
      : availableWidth;
    return {
      width: baseWidth,
      height: 200,
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 40,
      paddingLeft: 40,
    };
  }, [screenWidth]);

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setScreenWidth(window.width);
    };
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription.remove();
  }, []);

  const handleSavePinnedItems = async (newPinnedItems: string[]) => {
    try {
      await savePinnedMetricsUseCase.execute(newPinnedItems);
      setPinnedItems(newPinnedItems);
    } catch (error) {
      console.error("Failed to save pinned items:", error);
    } finally {
      setModalVisible(false);
    }
  };

  const fixedGradientHeight = 600;

  return (
    <LinearGradient
      colors={[
        colorPalette.primary.main,
        colorPalette.primary.main,
        colorPalette.neutral.background,
        colorPalette.neutral.background,
      ]}
      locations={[0, 0.4, 0.55, 0.6]}
      style={styles.layout}
    >
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={[colorPalette.primary.main, colorPalette.neutral.background]}
          locations={[0, fixedGradientHeight / contentHeight]}
          style={styles.gradient}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setContentHeight(height);
          }}
        >
          <Animated.View
            style={[
              styles.largeHeader,
              { height: largeHeaderHeight },
              largeHeaderOpacityStyle,
            ]}
          >
            <HemeaLogo size={isLargeScreen ? "xxlarge" : "xlarge"} />
            <TouchableOpacity onPress={navigateToSettings}>
              <Ionicons
                name="settings-outline"
                size={28}
                color={colorPalette.primary.light}
              />
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.container}>
            {loading ? (
              <View>
                <View style={styles.skeletonProfileRow} />
                <View style={styles.skeletonBlockLarge} />
                <View style={styles.skeletonRow} />
                <View style={styles.skeletonChart} />
                <View style={styles.skeletonRow} />
                <View style={styles.skeletonChart} />
              </View>
            ) : (
              <ZoomInWrapper duration={600} delay={0}>
                {userProfile ? (
                  <View style={styles.profileSection}>
                    <AvatarImage
                      profileImage={userProfile.profileImage}
                      firstName={userProfile.firstName}
                      lastName={userProfile.lastName}
                      style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>
                        {userProfile.firstName} {userProfile.lastName}
                      </Text>
                      <Text style={styles.profileDetails}>{userAge} ans</Text>
                      <Text style={styles.profileDetails}>
                        {analyses.length} Analyses enregistrées
                      </Text>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.SectionTitle}>
                  Indice d&apos;Équilibre Biologique
                </Text>
                {healthMagnitudeData.length > 1 && (
                  <View style={styles.healthMagnitudeContainer}>
                    <HealthMagnitudeChart
                      data={healthMagnitudeData}
                      chartDimensions={chartDimensions}
                    />
                  </View>
                )}
                <Text style={styles.textBubble}>
                  * L&apos;IEB représente l&apos;état global de vos analyses.
                  Restez
                  <Text style={{ fontWeight: "bold" }}>
                    {" "}
                    en dessous de 0.5{" "}
                  </Text>
                  pour être dans la zone normale. Plus l&apos;indice est bas,
                  plus vos résultats sont équilibrés.
                </Text>

                <TouchableOpacity
                  onPress={navigateToAllAnalyses}
                  style={styles.allAnalysesDataButton}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="document"
                      size={28}
                      color={colorPalette.secondary.main}
                    />
                  </View>
                  <Text style={styles.allAnalysesDataButtonText}>
                    Afficher toutes les Analyses
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colorPalette.neutral.white}
                  />
                </TouchableOpacity>

                <View style={styles.pinnedSection}>
                  <Text style={styles.pinnedSectionTitle}>📌 Épinglés</Text>
                  <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>
                </View>

                {(() => {
                  const chartComponents = pinnedItems
                    .map((item) => {
                      const chartData = getFilteredDataForLabKey(item);
                      if (chartData.length < 2) return null;
                      return (
                        <View key={item} style={styles.pinnedItem}>
                          <ChartItem
                            labKey={item}
                            data={chartData}
                            unit={LAB_VALUE_UNITS[item] || ""}
                            getReferenceRangeUseCase={getReferenceRangeUseCase}
                            calculateStatisticsUseCase={
                              calculateStatisticsUseCase
                            }
                            chartDimensions={chartDimensions}
                            formatDate={formatDate}
                            showStats={false}
                            showInfoButton={false}
                          />
                        </View>
                      );
                    })
                    .filter(Boolean);

                  if (chartComponents.length > 0) return chartComponents;

                  if (pinnedItems.length > 0) {
                    return (
                      <View style={styles.emptyStateContainer}>
                        <Ionicons
                          name="stats-chart-outline"
                          size={48}
                          color={colorPalette.neutral.light}
                        />
                        <Text style={styles.emptyStateText}>
                          No Recent Data
                        </Text>
                        <Text style={styles.emptyStateSubText}>
                          No data available for the last 3 years for your pinned
                          items.
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons
                        name="pin-outline"
                        size={48}
                        color={colorPalette.neutral.light}
                      />
                      <Text style={styles.emptyStateText}>No Pinned Items</Text>
                      <Text style={styles.emptyStateSubText}>
                        Click &quot;Modifier&quot; to select analyses to display
                        on your home screen.
                      </Text>
                    </View>
                  );
                })()}
              </ZoomInWrapper>
            )}
          </View>
        </LinearGradient>
        <View style={styles.bottonSpacer} />
      </Animated.ScrollView>
      <PinnedItemsModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        pinnedItems={pinnedItems}
        onSave={handleSavePinnedItems}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  layout: { flex: 1 },
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  largeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBlockStart: 80,
  },
  allAnalysesDataButton: {
    backgroundColor: colorPalette.secondary.main,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
    marginRight: 15,
    paddingLeft: 2,
    paddingTop: 2,
  },
  allAnalysesDataButtonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: colorPalette.neutral.white,
  },
  pinnedSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  pinnedSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colorPalette.neutral.dark,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  editButtonText: {
    fontSize: 16,
    color: colorPalette.primary.main,
    fontWeight: "600",
  },
  pinnedItem: { marginBottom: 16 },
  emptyStateContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 15,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colorPalette.neutral.dark,
    textAlign: "center",
  },
  emptyStateSubText: {
    marginTop: 8,
    fontSize: 14,
    color: colorPalette.neutral.light,
    textAlign: "center",
  },
  bottonSpacer: {
    height: 90,
    backgroundColor: colorPalette.neutral.background,
  },
  healthMagnitudeContainer: {
    marginTop: 5,
    marginBottom: 10,
    padding: 10,
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "transparent",
    elevation: 3,
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 15,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: colorPalette.neutral.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileDetails: {
    fontSize: 16,
    color: colorPalette.neutral.white,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonProfileRow: {
    height: 120,
    borderRadius: 15,
    backgroundColor: colorPalette.neutral.white,
    marginBottom: 20,
    opacity: 0.6,
  },
  skeletonBlockLarge: {
    height: 60,
    borderRadius: 12,
    backgroundColor: colorPalette.neutral.white,
    marginBottom: 16,
    opacity: 0.6,
  },
  skeletonRow: {
    height: 24,
    borderRadius: 12,
    backgroundColor: colorPalette.neutral.white,
    marginVertical: 8,
    opacity: 0.6,
  },
  skeletonChart: {
    height: 200,
    borderRadius: 15,
    backgroundColor: colorPalette.neutral.white,
    marginVertical: 10,
    opacity: 0.6,
  },
  SectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colorPalette.neutral.dark,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  textBubble: {
    paddingHorizontal: 5,
    fontSize: 12,
    fontStyle: "italic",
    color: colorPalette.neutral.dark,
    paddingBottom: 20,
  },
});
