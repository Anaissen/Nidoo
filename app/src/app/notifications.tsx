import { Pressable, View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, Txt } from '../components/ui';
import { useNotifications } from '../lib/notifications';
import { colors } from '../theme/tokens';

export default function Notifications() {
  const items = useNotifications();

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 6, paddingTop: 4 }}>
        <BackHeader title="Notifications" style={{ marginBottom: 8 }} />
        {items.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
            <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Rien de nouveau pour le moment. Tes ventes, tes achats et les avis s'afficheront ici.</Txt>
          </View>
        )}
        {items.map((n) => (
          <Pressable
            key={n.text}
            onPress={n.open}
            style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12, marginHorizontal: -12, borderRadius: 24, backgroundColor: pressed ? colors.neutral100 : 'transparent' })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: n.bg, alignItems: 'center', justifyContent: 'center' }}>
              <H size={16}>{n.init}</H>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14}>{n.text}</Txt>
              <Txt size={12} color={colors.neutral700}>{n.when}</Txt>
            </View>
            {n.unread && <View style={{ width: 10, height: 10, marginTop: 6, borderRadius: 5, backgroundColor: colors.accent }} />}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
