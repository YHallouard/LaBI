import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../config/themes";

export const SettingsButton: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Home", { screen: "SettingsScreen" })}
      style={styles.button}
    >
      <Ionicons
        name="settings-outline"
        size={24}
        color={colorPalette.primary.main}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { marginRight: 15 },
});
