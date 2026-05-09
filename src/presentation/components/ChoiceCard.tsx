import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../config/themes";

type ChoiceCardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badge?: string;
  hint?: string;
  onPress: () => void;
};

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  title,
  subtitle,
  iconName,
  iconColor = colorPalette.primary.main,
  badge,
  hint,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconCircle, { backgroundColor: iconColor + "22" }]}>
      <Ionicons name={iconName} size={28} color={iconColor} />
    </View>

    <View style={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color={colorPalette.neutral.light}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colorPalette.neutral.main,
  },
  badge: {
    backgroundColor: colorPalette.feedback.success + "30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0d8b4f",
  },
  subtitle: {
    fontSize: 13,
    color: colorPalette.neutral.light,
    lineHeight: 18,
  },
  hint: {
    fontSize: 11,
    color: colorPalette.neutral.light,
    marginTop: 6,
  },
});
