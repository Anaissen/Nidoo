import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { OptionCard } from '../components/OptionCard';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { H, PrimaryButton, Txt } from '../components/ui';
import { DELIVERY, DELIVERY_DETAIL } from '../data/catalog';
import { useCartGroups } from '../lib/cart';
import { fmt } from '../lib/format';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';


export default function Checkout() {
  const { items, groups, subtotal } = useCartGroups();
  const del = useStore((s) => s.del);
  const pay = useStore((s) => s.pay);
  const set = useStore((s) => s.set);
  const placeOrder = useStore((s) => s.placeOrder);

  const ship = DELIVERY.find((d) => d.id === del)!.price * groups.length;
  const total = subtotal + ship;

  const onPay = () => {
    const oid = placeOrder();
    router.dismissAll();
    router.push(`/order-done?oid=${oid}`);
  };

  return (
    <Screen
      bottom={<BottomBar><PrimaryButton label={`Payer ${fmt(total)}`} onPress={onPay} disabledLook={!items.length} disabled={!items.length} style={{ flex: 1 }} /></BottomBar>}
      contentStyle={{ paddingHorizontal: 20 }}
    >
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Paiement" />

        <View style={{ gap: 8 }}>
          <H size={18}>Livraison</H>
          {DELIVERY.map((d) => (
            <OptionCard key={d.id} control="radio" on={del === d.id} title={d.title} sub={d.sub} onPress={() => set({ del: d.id })}
              right={<Txt weight="bold">{d.price ? fmt(d.price) : 'Gratuit'}</Txt>} />
          ))}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
            <MapPin size={20} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
            <Txt size={13} color={colors.accent2_800} style={{ flex: 1 }}>{DELIVERY_DETAIL[del]}</Txt>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <H size={18}>Moyen de paiement</H>
          <OptionCard control="radio-inline" on={pay === 'card'} title="Carte bancaire" sub="•••• 4242" onPress={() => set({ pay: 'card' })} />
          <OptionCard control="radio-inline" on={pay === 'apple'} title="Apple Pay" onPress={() => set({ pay: 'apple' })} />
        </View>

        <View style={{ gap: 8, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
          <Line l={`Articles (${items.length})`} r={fmt(subtotal)} />
          <Line l={`Livraison (${groups.length} colis)`} r={ship ? fmt(ship) : 'Gratuit'} />
          <Line l="Protection acheteur" r="Offerte" muted />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Txt size={17} weight="bold">Total</Txt>
            <Txt size={17} weight="bold">{fmt(total)}</Txt>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const Line = ({ l, r, muted }: { l: string; r: string; muted?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{l}</Txt>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{r}</Txt>
  </View>
);
