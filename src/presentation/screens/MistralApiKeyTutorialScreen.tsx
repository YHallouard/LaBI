import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, ActivityIndicator, View, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { ScreenLayout } from "../components/ScreenLayout";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import {
  HeaderButtons,
  HeaderButton,
  Item,
} from "react-navigation-header-buttons";
import { Ionicons } from "@expo/vector-icons";
import { colorPalette } from "../../config/themes";

const MISTRAL_TUTORIAL_URL =
  "https://yhallouard.github.io/LaBI/create-mistral-api-key.html";

/* eslint-disable @typescript-eslint/no-explicit-any */
const IoniconsHeaderButton = (props: any) => (
  <HeaderButton
    IconComponent={Ionicons}
    iconSize={23}
    color={colorPalette.primary.main}
    {...props}
  />
);

type MistralApiKeyTutorialScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "MistralApiKeyTutorial">;
};

export const MistralApiKeyTutorialScreen: React.FC<
  MistralApiKeyTutorialScreenProps
> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
          <Item
            title="Open in Browser"
            iconName="open-outline"
            onPress={() => {
              Linking.openURL(MISTRAL_TUTORIAL_URL);
            }}
          />
        </HeaderButtons>
      ),
    });
  }, [navigation]);

  return (
    <ScreenLayout>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary.main} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: MISTRAL_TUTORIAL_URL }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.background,
    zIndex: 1,
  },
});
