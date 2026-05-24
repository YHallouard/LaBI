import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import { colorPalette } from "../../config/themes";
import { Ionicons } from "@expo/vector-icons";
import { LAB_VALUE_DEFAULT_RANGES, LAB_VALUE_KEYS } from "../../config/LabConfig";
import { GlassCard } from "./glass/GlassCard";

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
    <TouchableOpacity onPress={handlePress} disabled={!onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.date}>{formattedDate}</Text>
          <View style={styles.valueContainer}>
            <Ionicons name={indicatorIcon} size={24} color={indicatorColor} />
            <Text style={[styles.value, { color: indicatorColor }]}>
              {outOfRangeCount}
            </Text>
          </View>
        </View>
      </GlassCard>
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
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16,
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
    minWidth: 24,
    textAlign: "center",
  },
});
