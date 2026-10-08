import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '../components/Toast';
import { startBackend } from '../lib/backend';
import { startMarket } from '../lib/listings';
import { startMessaging } from '../lib/messaging';
import { useStore } from '../store/useStore';
import { applyTheme, colors, shadows } from '../theme/tokens';

startBackend();
startMarket();
startMessaging();

export default function RootLayout() {
  const [loaded] = useFonts({ Caprasimo_400Regular, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });
  const system = useColorScheme();
  const theme = useStore((s) => s.theme);
  const textScale = useStore((s) => s.textScale);
  const returnTo = useStore((s) => s.returnTo);
  const pendingRecovery = useStore((s) => s.pendingRecovery);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 600;

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

  // Back from the "mot de passe oublié" e-mail: ask for the new password.
  useEffect(() => {
    // (On first load the entry screen redirects there itself.)
    if (pendingRecovery && loaded && pathname !== '/' && pathname !== '/new-password') router.push('/new-password');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRecovery, loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider style={framed ? { backgroundColor: colors.surface } : undefined}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {/* On a wide web screen (link shared to a computer), show the app in a phone-sized column. */}
      <View key={look} style={[{ flex: 1, backgroundColor: colors.bg }, framed && { width: 430, alignSelf: 'center', boxShadow: shadows.lg }]}>
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
