import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '../components/Toast';
import { useStore } from '../store/useStore';
import { applyTheme, colors } from '../theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({ Caprasimo_400Regular, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });
  const system = useColorScheme();
  const theme = useStore((s) => s.theme);
  const textScale = useStore((s) => s.textScale);
  const returnTo = useStore((s) => s.returnTo);
  const pathname = usePathname();

  const mode = theme === 'auto' ? (system === 'dark' ? 'dark' : 'light') : theme;
  // Swap the live palette before anything below renders; the `key` then re-mounts every screen with it.
  applyTheme(mode, textScale);
  const look = `${mode}-${textScale}`;

  // Re-mounting resets navigation: bring the person back to where they changed the setting.
  useEffect(() => {
    if (!returnTo) return;
    const t = setTimeout(() => {
      useStore.getState().set({ returnTo: null });
      if (pathname !== returnTo) router.push(returnTo as never);
    }, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View key={look} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sell" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="sell-done" options={{ gestureEnabled: false }} />
          <Stack.Screen name="order-done" options={{ gestureEnabled: false }} />
          <Stack.Screen name="guide" options={{ gestureEnabled: false }} />
        </Stack>
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}
