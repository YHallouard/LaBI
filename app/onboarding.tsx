import { useRouter } from 'expo-router';
import { ProfileScreen } from '../src/presentation/screens/settings/ProfileScreen';

export default function OnboardingScreen() {
  const router = useRouter();
  return (
    <ProfileScreen
      onboarding
      onProfileSaved={() => router.replace('/(tabs)')}
    />
  );
}
