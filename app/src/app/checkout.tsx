import { router } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatKm } from '../components/Badges';
import { OptionCard } from '../components/OptionCard';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { H, PrimaryButton, Txt } from '../components/ui';
import { DELIVERY, DELIVERY_DETAIL, HANDOVER_MAX_KM, SAFE_SPOTS } from '../data/catalog';
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
  const showToast = useStore((s) => s.showToast);

  const [spot, setSpot] = useState(SAFE_SPOTS[0].id);
  // Hand-to-hand only when every seller in the cart is close enough.
  const far = groups.map((g) => g.seller).filter((sl) => sl.distanceKm > HANDOVER_MAX_KM);
  const options = far.length ? DELIVERY.filter((d) => d.id !== 'main') : DELIVERY;
  useEffect(() => { if (far.length && del === 'main') set({ del: 'relais' }); }, [far.length, del, set]);

  const ship = DELIVERY.find((d) => d.id === del)!.price * groups.length;
  const total = subtotal + ship;

  const onPay = () => {
    const { oid, ticked } = placeOrder();
    const kid = useStore.getState().kids.find((k) => k.id === useStore.getState().activeKidId);
    if (ticked && kid) showToast(`✓ Coché dans la garde-robe de ${kid.name}`);
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
          {options.map((d) => (
            <OptionCard key={d.id} control="radio" on={del === d.id} title={d.title} sub={d.sub} onPress={() => set({ del: d.id })}
              right={<Txt weight="bold">{d.price ? fmt(d.price) : 'Gratuit'}</Txt>} />
          ))}
          {far.length > 0 && (
            <Txt size={13} color={colors.neutral700}>Main propre indisponible : {far.map((sl) => `${sl.name} (${formatKm(sl.distanceKm)})`).join(', ')} est trop loin.</Txt>
          )}
          {del === 'main' ? (
            <View style={{ gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <Txt size={13} weight="semi" color={colors.accent2_800}>Choisis un lieu public et fréquenté près de chez toi :</Txt>
              {SAFE_SPOTS.map((sp) => {
                const on = spot === sp.id;
                return (
                  <Pressable key={sp.id} onPress={() => setSpot(sp.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: colors.neutral100, borderWidth: 2, borderColor: on ? colors.accent2_600 : 'transparent' }}>
                    <MapPin size={18} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="semi">{sp.name}</Txt>
                      <Txt size={12} color={colors.neutral700}>{sp.addr} · {sp.dist}</Txt>
                    </View>
                    {on && <Check size={18} strokeWidth={3} color={colors.accent2_700} />}
                  </Pressable>
                );
              })}
              <Txt size={12} color={colors.accent2_800}>Tu fixeras l'heure avec le vendeur dans la messagerie. Ne paie jamais en liquide : le paiement reste protégé par Pimoo.</Txt>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <MapPin size={20} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
              <Txt size={13} color={colors.accent2_800} style={{ flex: 1 }}>{DELIVERY_DETAIL[del]}</Txt>
            </View>
          )}
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
