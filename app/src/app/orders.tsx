import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Thumb } from '../components/products';
import { BackHeader, Screen } from '../components/Screen';
import { ellipsis, Segmented, Tag, Txt } from '../components/ui';
import { fmt } from '../lib/format';
import { commissionRate, Order, productById, sellerById, useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

const BUY_STATUS = ['Payée', 'Expédiée', 'En point relais', 'Reçue'];
const SALE_STATUS = ['À expédier', 'Expédiée', 'En point relais', 'Vendue · versé'];

function orderStatus(o: Order, isSale: boolean) {
  if (isSale) return SALE_STATUS[o.status];
  return o.del === 'Main propre' && o.status === 2 ? 'Rendez-vous fixé' : BUY_STATUS[o.status];
}

export default function Orders() {
  const params = useLocalSearchParams<{ tab?: 'achats' | 'ventes' }>();
  const [tab, setTab] = useState<'achats' | 'ventes'>(params.tab ?? 'achats');
  const purchases = useStore((s) => s.purchases);
  const sales = useStore((s) => s.sales);
  const mine = useStore((s) => s.mine);
  const rate = commissionRate(useStore((s) => s.commission));
  const isSale = tab === 'ventes';
  const list = isSale ? sales : purchases;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Mes commandes" />
        <Segmented options={[['achats', 'Achats'], ['ventes', 'Ventes']]} value={tab} onChange={setTab} />

        {list.map((o) => {
          const p = productById(mine, o.pid)!;
          const done = o.status >= 3;
          const sub = isSale ? `${o.buyer} · tu reçois ${fmt((o.price ?? p.price) * (1 - rate))}` : `${sellerById(p.sid)!.name} · ${o.del}`;
          return (
            <Pressable key={o.id} onPress={() => router.push(`/tracking/${o.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 26, backgroundColor: colors.neutral100 }}>
              <Thumb p={p} size={68} radius={20} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Txt size={14} weight="semi" {...ellipsis}>{p.title}</Txt>
                <Txt size={13} color={colors.neutral700} {...ellipsis}>{sub}</Txt>
                <Tag label={orderStatus(o, isSale)} size={12} bg={done ? colors.accent2_100 : colors.accent100} fg={done ? colors.accent2_800 : colors.accent800} style={{ paddingVertical: 3 }} />
              </View>
              <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.text} />
            </Pressable>
          );
        })}

        {list.length === 0 && (
          <View style={{ paddingVertical: 32, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
            <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Rien ici pour le moment.</Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}
