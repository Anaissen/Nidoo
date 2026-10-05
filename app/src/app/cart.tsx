import { router } from 'expo-router';
import { BadgeCheck, ShoppingBag, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { openProduct, Thumb, typeLabel } from '../components/products';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { Avatar, CircleButton, ellipsis, H, PrimaryButton, Txt } from '../components/ui';
import { requireAccount } from '../lib/auth';
import { fmt } from '../lib/format';
import { useCartGroups } from '../lib/cart';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

export default function Cart() {
  const { items, groups, subtotal } = useCartGroups();
  const remove = useStore((s) => s.removeFromCart);

  const bottom = items.length > 0 ? (
    <BottomBar><PrimaryButton label={`Commander · ${fmt(subtotal)}`} onPress={() => requireAccount('commander') && router.push('/checkout')} style={{ flex: 1 }} /></BottomBar>
  ) : undefined;

  return (
    <Screen bottom={bottom} contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Panier" />

        {groups.map((g) => (
          <View key={g.seller.id} style={{ padding: 16, borderRadius: 30, backgroundColor: colors.neutral100, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar init={g.seller.init} size={32} font={14} />
              <Txt size={14} weight="bold">{g.seller.name}</Txt>
              {g.seller.verified && <BadgeCheck size={16} strokeWidth={2.75} color={colors.accent2_700} accessibilityLabel="Parent vérifié" />}
              <Txt size={12} color={colors.neutral700} style={{ marginLeft: 'auto' }}>1 colis</Txt>
            </View>
            {g.items.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Pressable onPress={() => openProduct(p.id)}><Thumb p={p} size={72} radius={20} /></Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={14} weight="semi" {...ellipsis}>{p.title}</Txt>
                  <Txt size={13} color={colors.neutral700}>{p.size} · {typeLabel(p)}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Txt weight="bold">{fmt(p.price)}</Txt>
                    {p.price !== p.listPrice && <Txt size={12} color={colors.neutral600} style={{ textDecorationLine: 'line-through' }}>{fmt(p.listPrice)}</Txt>}
                    {p.price !== p.listPrice && <Txt size={12} weight="semi" color={colors.accent2_700}>offre acceptée</Txt>}
                  </View>
                </View>
                <CircleButton size={36} onPress={() => remove(p.id)} accessibilityLabel="Retirer">
                  <X size={16} strokeWidth={ICON_STROKE} color={colors.neutral700} />
                </CircleButton>
              </View>
            ))}
          </View>
        ))}

        {items.length === 0 ? (
          <View style={{ paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', gap: 12 }}>
            <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={40} strokeWidth={ICON_STROKE} color={colors.neutral600} />
            </View>
            <H size={22}>Ton panier est vide</H>
            <Txt size={14} color={colors.neutral800} style={{ textAlign: 'center' }}>Ajoute une pièce ou un lot pour commencer.</Txt>
            <PrimaryButton label="Explorer" height={48} size={16} onPress={() => router.navigate('/search')} style={{ paddingHorizontal: 24 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Txt size={14} color={colors.neutral800}>Sous-total</Txt>
            <Txt size={14} weight="bold">{fmt(subtotal)}</Txt>
          </View>
        )}
      </View>
    </Screen>
  );
}
