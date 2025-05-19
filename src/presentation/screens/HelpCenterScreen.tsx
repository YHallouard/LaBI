import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import { colorPalette } from "../../config/themes";

type HelpCenterScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "HelpCenterScreen">;
};

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({
  navigation,
}) => {
  const handleEmailPress = () => {
    Linking.openURL("mailto:hemea@gmail.com");
  };

  const openMistralApiKeyTutorial = () => {
    navigation.navigate("MistralApiKeyTutorial");
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Ionicons
          name="help-circle-outline"
          size={80}
          color={colorPalette.primary.main}
          style={styles.icon}
        />

        <Text style={styles.title}>Need Help?</Text>

        <Text style={styles.description}>
          If you have any questions or issues with the app, please feel free to
          contact our support team.
        </Text>

        <TouchableOpacity
          style={styles.emailContainer}
          onPress={handleEmailPress}
        >
          <Ionicons
            name="mail-outline"
            size={24}
            color={colorPalette.primary.main}
            style={styles.emailIcon}
          />
          <Text style={styles.emailText}>contact.hemea@gmail.com</Text>
        </TouchableOpacity>

        <Text style={styles.responseText}>
          We&apos;ll get back to you as soon as possible.
        </Text>

        <Text style={styles.title}>Tutorials</Text>

        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={openMistralApiKeyTutorial}
        >
          <Ionicons
            name="key-outline"
            size={24}
            color={colorPalette.neutral.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Mistral API Key Tutorial</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colorPalette.neutral.light,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  tutorialButton: {
    backgroundColor: colorPalette.primary.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    width: "100%",
  },
  buttonText: {
    color: colorPalette.neutral.white,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailIcon: {
    marginRight: 10,
  },
  emailText: {
    fontSize: 18,
    color: colorPalette.primary.main,
    fontWeight: "500",
  },
  responseText: {
    fontSize: 14,
    color: colorPalette.neutral.light,
    textAlign: "center",
    marginBottom: 20,
  },
});
