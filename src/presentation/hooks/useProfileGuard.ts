import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUseCases } from '../contexts/UseCasesContext';

/**
 * Redirects to /onboarding when no profile exists.
 * Must be called from a component rendered UNDER <UseCasesProvider>.
 * Returns { checking: true } until the async check completes — use this to
 * show a loading indicator and prevent a flash of the empty HomeScreen.
 */
export function useProfileGuard(): { checking: boolean } {
  const router = useRouter();
  const segments = useSegments();
  const { bundle, isReady } = useUseCases();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isReady || !bundle) return;
    const onOnboarding = segments[0] === 'onboarding';

    bundle.retrieveUserProfileUseCase.execute().then((profile) => {
      if (!profile && !onOnboarding) {
        router.replace('/onboarding');
      }
      setChecking(false);
    });
  }, [isReady, bundle]);

  return { checking };
}
