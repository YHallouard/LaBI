import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colorPalette } from "../../config/themes";

interface EmptyStateProps {
  message: string;
  subMessage: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  subMessage,
  iconName,
}) => {
  const router = useRouter();

  return (
    <View style={styles.centered}>
      <Ionicons name={iconName} size={60} color={colorPalette.neutral.light} />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{subMessage}</Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => router.push("/upload")}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color={colorPalette.neutral.white}
          style={styles.buttonIcon}
        />
        <Text style={styles.uploadButtonText}>Upload Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: colorPalette.neutral.light,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: colorPalette.primary.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: 200,
  },
  uploadButtonText: {
    color: colorPalette.neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
