import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";

interface EmptyStateProps {
  navigation: StackNavigationProp<HomeStackParamList, "HomeScreen">;
  message: string;
  subMessage: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  navigation,
  message,
  subMessage,
  iconName,
}) => {
  return (
    <View style={styles.centered}>
      <Ionicons name={iconName} size={60} color="#95aac9" />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{subMessage}</Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate("Upload");
        }}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color="white"
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
    color: "#12263f",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#95aac9",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: "#2c7be5",
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
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
