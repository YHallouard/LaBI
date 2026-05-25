import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  ScreenHeader,
} from '../../../design-system';

const PRIVACY_POLICY_URL = 'https://yhallouard.github.io/LaBI/privacy-policy.html';

export function PrivacyPolicyWebViewScreen() {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Politique de confidentialité"
        right={
          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
            <Ionicons name="open-outline" size={20} color={colors.primary} />
          </Pressable>
        }
      />

      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ uri: PRIVACY_POLICY_URL }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        automaticallyAdjustContentInsets={false}
        contentInset={{ bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  webview: { flex: 1 },
});
