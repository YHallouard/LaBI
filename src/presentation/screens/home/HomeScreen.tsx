import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScaledSize,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../../config/themes";
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const headerVisible = useRef(false);
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

  const isLargeScreen = screenWidth >= 1000;
  const largeHeaderHeight = isLargeScreen ? 220 : 100;
  const smallHeaderAppearsAt = largeHeaderHeight - 40;

  const fixedGradientHeight = 600;

  useFocusEffect(
    useCallback(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const currentScrollY = (scrollY as any)._value || 0;

      const shouldHeaderBeVisible = currentScrollY > smallHeaderAppearsAt;

      if (!shouldHeaderBeVisible) {
        headerOpacity.setValue(0);
        headerBackgroundOpacity.setValue(0);
        headerVisible.current = false;
        navigation.setOptions({
          headerTransparent: true,
          headerTitle: "",
          headerRight: undefined,
          headerStyle: {
            backgroundColor: "transparent",
            shadowOpacity: 0,
            elevation: 0,
          },
        });
      }
    }, [navigation, scrollY, headerOpacity, headerBackgroundOpacity])
  );

  const loadPinnedItems = useCallback(async () => {
    try {
      const items = await getPinnedMetricsUseCase.execute();
      if (items.length > 0) {
        setPinnedItems(items);
      } else {
        setPinnedItems(["Hémoglobine", "Leucocytes", "Plaquettes"]);
      }
    } catch (error) {
      console.error("Failed to load pinned items:", error);
      // fallback to default
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

  const navigateToSettings = () => {
    navigation.navigate("SettingsScreen");
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
    const isLargeScreen = screenWidth >= 1000;
    const availableWidth = screenWidth - (isLargeScreen ? 40 : 32);
    const baseWidth = isLargeScreen
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

  useEffect(() => {
    const scrollYValue = { current: 0 };
    const listenerId = scrollY.addListener(({ value }) => {
      scrollYValue.current = value;
      const shouldBeVisible = value > smallHeaderAppearsAt;
      if (shouldBeVisible && !headerVisible.current) {
        headerVisible.current = true;

        const headerBackgroundColor = headerBackgroundOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [
            "rgba(255, 255, 255, 0)",
            colorPalette.neutral.background,
          ],
        });

        navigation.setOptions({
          headerTransparent: true,
          headerTitleAlign: "center",
          headerTitle: () => (
            <Animated.View style={{ opacity: headerOpacity }}>
              <HemeaLogo />
            </Animated.View>
          ),
          headerRight: () => (
            <Animated.View style={{ opacity: headerOpacity, marginRight: 15 }}>
              <TouchableOpacity onPress={navigateToSettings}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colorPalette.primary.main}
                />
              </TouchableOpacity>
            </Animated.View>
          ),
          headerBackground: () => (
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: headerBackgroundColor,
                shadowColor: colorPalette.neutral.main,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: headerBackgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
                shadowRadius: 5,
                elevation: headerBackgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 5],
                }),
              }}
            />
          ),
        });

        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(headerBackgroundOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start(({ finished }) => {
          if (finished && scrollYValue.current <= smallHeaderAppearsAt) {
            navigation.setOptions({
              headerTransparent: true,
              headerTitle: "",
              headerRight: undefined,
              headerBackground: undefined,
            });
          }
        });
      } else if (!shouldBeVisible && headerVisible.current) {
        headerVisible.current = false;

        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(headerBackgroundOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start(({ finished }) => {
          if (finished && scrollYValue.current <= smallHeaderAppearsAt) {
            navigation.setOptions({
              headerTransparent: true,
              headerTitle: "",
              headerRight: undefined,
              headerBackground: undefined,
            });
          }
        });
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [
    navigation,
    scrollY,
    headerOpacity,
    headerBackgroundOpacity,
    smallHeaderAppearsAt,
  ]);

  const largeHeaderOpacity = scrollY.interpolate({
    inputRange: [0, smallHeaderAppearsAt / 2, smallHeaderAppearsAt],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  const navigateToAllAnalyses = () => {
    navigation.navigate("AllAnalysesScreen");
  };

  const handleSavePinnedItems = async (newPinnedItems: string[]) => {
    try {
      await savePinnedMetricsUseCase.execute(newPinnedItems);
      setPinnedItems(newPinnedItems);
    } catch (error) {
      console.error("Failed to save pinned items:", error);
      // Optionally, show an error to the user
    } finally {
      setModalVisible(false);
    }
  };

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
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
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
              {
                height: largeHeaderHeight,
                opacity: largeHeaderOpacity,
              },
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
                      if (chartData.length < 2) {
                        return null;
                      }
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

                  if (chartComponents.length > 0) {
                    return chartComponents;
                  }

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
  layout: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
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
  pinnedItem: {
    marginBottom: 16,
  },
  pinnedItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: colorPalette.neutral.dark,
  },
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
  profileInfo: {
    flex: 1,
  },
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
