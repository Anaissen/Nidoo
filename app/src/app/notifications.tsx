import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useSearchWith } from '../components/home/shared';
import { BackHeader, Screen } from '../components/Screen';
import { H, Txt } from '../components/ui';
import { growthAlert } from '../lib/kids';
import { productById, useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

export default function Notifications() {
  const openChatFor = useStore((s) => s.openChatFor);
  const searchWith = useSearchWith();

  const kids = useStore((s) => s.kids);
  const sales = useStore((s) => s.sales);
  const mine = useStore((s) => s.mine);
  const grow = kids.map((k) => ({ k, a: growthAlert(k) })).filter((x) => x.a);
  const items = [
    ...grow.map(({ k, a }) => ({ init: '🌱', bg: colors.accent2_200, text: `Il grandit ! ${a!.text}. Prépare sa nouvelle garde-robe.`, when: "Aujourd'hui", unread: true, open: () => router.push(`/passport/${k.id}`) })),
    ...sales.filter((o) => o.status === 0 && o.del !== 'Main propre').map((o) => ({ init: '€', bg: colors.accent2_300, text: `Vendu ! ${o.buyer} a acheté « ${productById(mine, o.pid)?.title} ». Ton bordereau est prêt.`, when: "Aujourd'hui", unread: true, open: () => router.push(`/label/${o.id}`) })),
    { init: 'J', bg: colors.accent2_300, text: 'Julie M. a répondu à propos de « Robe en lin smockée »', when: 'il y a 12 min', unread: true, open: () => router.push(`/chat/${openChatFor('s2', 2)}`) },
    { init: '%', bg: colors.accent200, text: 'Baisse de prix sur un favori : Lot été fille 9 pièces passe à 25,00 €', when: 'il y a 2 h', unread: true, open: () => router.push('/product/7') },
    { init: '⌂', bg: colors.neutral300, text: 'Ton colis « Lot rentrée garçon » est disponible en point relais', when: 'Hier', unread: false, open: () => router.push('/tracking/o1') },
    { init: '+', bg: colors.accent100, text: '3 nouveaux lots en 2-4 ans près de chez toi', when: 'Lun.', unread: false, open: () => { router.back(); searchWith({ f: { ages: ['2-4 ans'] }, ftype: 'lot' }); } },
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 6, paddingTop: 4 }}>
        <BackHeader title="Notifications" style={{ marginBottom: 8 }} />
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
