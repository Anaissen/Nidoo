import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

/** Entry: wait for persisted settings, then start at onboarding (first launch) or home. */
export default function Index() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    if (hydrated) return;
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
