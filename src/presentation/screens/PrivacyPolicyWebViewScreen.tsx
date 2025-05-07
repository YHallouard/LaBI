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

const PRIVACY_POLICY_URL =
  "https://yhallouard.github.io/LaBI/privacy-policy.html";

/* eslint-disable @typescript-eslint/no-explicit-any */
const IoniconsHeaderButton = (props: any) => (
  <HeaderButton
    IconComponent={Ionicons}
    iconSize={23}
    color="#2c7be5"
    {...props}
  />
);

type PrivacyPolicyWebViewScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "PrivacyPolicyWebView">;
};

export const PrivacyPolicyWebViewScreen: React.FC<
  PrivacyPolicyWebViewScreenProps
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
              Linking.openURL(PRIVACY_POLICY_URL);
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
          <ActivityIndicator size="large" color="#2c7be5" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: PRIVACY_POLICY_URL }}
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
    backgroundColor: "#f5f7fb",
    zIndex: 1,
  },
});
