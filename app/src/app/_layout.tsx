import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '../components/Toast';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({ Caprasimo_400Regular, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sell" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="sell-done" options={{ gestureEnabled: false }} />
          <Stack.Screen name="order-done" options={{ gestureEnabled: false }} />
        </Stack>
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}
