import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { House, LucideIcon, MessageCircle, Plus, Search, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { colors, ICON_STROKE, shadows } from '../../theme/tokens';

const ITEMS: Record<string, { label: string; Icon: LucideIcon }> = {
  home: { label: 'Accueil', Icon: House },
  search: { label: 'Rechercher', Icon: Search },
  messages: { label: 'Messages', Icon: MessageCircle },
  profile: { label: 'Profil', Icon: User },
};

function NidooTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useStore((s) => Object.values(s.chats).filter((c) => c.unread).length);

  const tab = (index: number) => {
    const route = state.routes[index];
    const { label, Icon } = ITEMS[route.name];
    const focused = state.index === index;
    const color = focused ? colors.accent : colors.neutral600;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
        }}
        style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 }}
      >
        <Icon size={24} strokeWidth={ICON_STROKE} color={color} />
        <Txt size={11} weight="semi" color={color} lh={1.2}>{label}</Txt>
        {route.name === 'messages' && unread > 0 && (
          <View style={{ position: 'absolute', top: 2, left: '50%', marginLeft: 6, minWidth: 18, height: 18, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Txt size={11} weight="bold" color={colors.bg} lh={1}>{unread}</Txt>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 8, paddingBottom: Math.max(insets.bottom - 4, 12),
          backgroundColor: colors.neutral100, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: shadows.md,
        }}
      >
        {tab(0)}
        {tab(1)}
        <Pressable onPress={() => router.push('/sell')} accessibilityLabel="Vendre" style={{ flex: 1, alignItems: 'center', gap: 3 }}>
          <View style={{ width: 52, height: 52, marginTop: -26, borderRadius: 26, backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.neutral100, alignItems: 'center', justifyContent: 'center', boxShadow: shadows.md }}>
            <Plus size={24} strokeWidth={3} color={colors.bg} />
          </View>
          <Txt size={11} weight="semi" lh={1.2}>Vendre</Txt>
        </Pressable>
        {tab(2)}
        {tab(3)}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <NidooTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
