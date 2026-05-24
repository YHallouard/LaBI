import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../config/themes";

interface TabBarActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
}

export const TabBarActionButton: React.FC<TabBarActionButtonProps> = ({
  iconName,
  onPress,
  loading = false,
  backgroundColor = colorPalette.primary.main,
  iconColor = colorPalette.neutral.white,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons name={iconName} size={20} color={iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
