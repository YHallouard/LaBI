import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import { colorPalette } from "../../config/themes";
import { Ionicons } from "@expo/vector-icons";
import { LAB_VALUE_DEFAULT_RANGES, LAB_VALUE_KEYS } from "../../config/LabConfig";

type AnalysisCardProps = {
  analysis: BiologicalAnalysis;
  onPress?: (analysis: BiologicalAnalysis) => void;
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(analysis);
    }
  };

  const formattedDate = formatAnalysisDate(analysis.date);
  const outOfRangeCount = countOutOfRangeValues(analysis);
  const indicatorColor = getIndicatorColor(outOfRangeCount);
  const indicatorIcon = getIndicatorIcon(outOfRangeCount);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.valueContainer}>
          <Ionicons name={indicatorIcon} size={24} color={indicatorColor} />
          <Text style={[styles.value, { color: indicatorColor }]}>
            {outOfRangeCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const formatAnalysisDate = (date: Date): string => {
  return date.toLocaleDateString("fr-FR");
};

const countOutOfRangeValues = (analysis: BiologicalAnalysis): number => {
  return Object.entries(analysis).reduce((count, [key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      "value" in value &&
      LAB_VALUE_KEYS.includes(key)
    ) {
      const labValue = value as LabValue;
      const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];
      
      if (
        labValue.value !== null &&
        labValue.value !== undefined &&
        (labValue.value < range.min || labValue.value > range.max)
      ) {
        return count + 1;
      }
    }
    return count;
  }, 0);
};

const getIndicatorColor = (count: number): string => {
  if (count === 0) return colorPalette.feedback.success;
  if (count < 5) return colorPalette.feedback.labWarning;
  return colorPalette.feedback.error;
};

const getIndicatorIcon = (count: number): keyof typeof Ionicons.glyphMap => {
  if (count === 0) return "checkmark-circle";
  if (count < 5) return "warning";
  return "alert-circle";
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 16,
    fontWeight: "500",
  },
  valueContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
