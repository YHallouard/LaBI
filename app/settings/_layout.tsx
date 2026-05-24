import { Stack } from 'expo-router';
import { colors } from '../../src/design-system/tokens';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
