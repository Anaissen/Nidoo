import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { ellipsis, Segmented, Tag, Txt } from '../components/ui';
import { currentUser } from '../lib/backend';
import { fmt } from '../lib/format';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

const REAL_BUY: Record<string, string> = { paid: 'Payée', shipped: 'Expédiée', received: 'Reçue' };
const REAL_SALE: Record<string, string> = { paid: 'À expédier', shipped: 'Expédiée', received: 'Vendue · versé' };

export default function Orders() {
  const params = useLocalSearchParams<{ tab?: 'achats' | 'ventes' }>();
  const [tab, setTab] = useState<'achats' | 'ventes'>(params.tab ?? 'achats');
  const isSale = tab === 'ventes';
  const me = currentUser()?.id;
  const real = useStore((s) => s.realOrders).filter((o) => (isSale ? o.sellerId === me : o.buyerId === me));
  const people = useStore((s) => s.marketSellers);

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Mes commandes" />
        <Segmented options={[['achats', 'Achats'], ['ventes', 'Ventes']]} value={tab} onChange={setTab} />

        {real.map((o) => {
          const label = o.status === 'cancelled' ? 'Remboursée' : isSale ? REAL_SALE[o.status] : REAL_BUY[o.status];
          const done = o.status === 'received';
          const who = people[isSale ? o.buyerId : o.sellerId]?.name ?? 'un parent';
          return (
            <Pressable key={o.id} onPress={() => router.push(`/commande/${o.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 26, backgroundColor: colors.neutral100 }}>
              <View style={{ width: 68, height: 68, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.neutral200 }}>
                {o.photo && <Image source={{ uri: o.photo }} style={{ width: 68, height: 68 }} />}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Txt size={14} weight="semi" {...ellipsis}>{o.title}</Txt>
                <Txt size={13} color={colors.neutral700} {...ellipsis}>{isSale ? `${who} · tu reçois ${fmt(o.price - o.commission)}` : `${who} · ${fmt(o.price + o.shipping)}`}</Txt>
                <Tag label={label} size={12} bg={done ? colors.accent2_100 : colors.accent100} fg={done ? colors.accent2_800 : colors.accent800} style={{ paddingVertical: 3 }} />
              </View>
              <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.text} />
            </Pressable>
          );
        })}

        {real.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
            <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Rien ici pour le moment.</Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}
