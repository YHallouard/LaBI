import React, { useRef, useState } from "react";
import { StyleSheet, ActivityIndicator, View, TouchableOpacity, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { Stack } from "expo-router";
import { ScreenLayout } from "../../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../../config/themes";

const MISTRAL_TUTORIAL_URL =
  "https://yhallouard.github.io/LaBI/create-mistral-api-key.html";

export const MistralApiKeyTutorialScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  return (
    <ScreenLayout>
      <Stack.Screen
        options={{
          title: "API Key Tutorial",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Linking.openURL(MISTRAL_TUTORIAL_URL)}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="open-outline" size={22} color={colorPalette.primary.main} />
            </TouchableOpacity>
          ),
        }}
      />
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary.main} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: MISTRAL_TUTORIAL_URL }}
        style={styles.webview}
        automaticallyAdjustContentInsets={false}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  webview: { flex: 1 },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
    zIndex: 1,
  },
});
