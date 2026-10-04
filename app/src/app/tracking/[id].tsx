import { useLocalSearchParams } from 'expo-router';
import { Check, Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Thumb } from '../../components/products';
import { BackHeader, Screen } from '../../components/Screen';
import { ellipsis, H, OutlineButton, PrimaryButton, Txt } from '../../components/ui';
import { fmt } from '../../lib/format';
import { commissionRate, productById, sellerById, useStore } from '../../store/useStore';
import { colors } from '../../theme/tokens';

function stepsFor(del: string) {
  if (del === 'Domicile') return {
    labels: ['Commande payée', 'Colis expédié', 'En livraison', 'Reçu'],
    subs: ['Paiement protégé par Pimoo', 'Colis pris en charge par le transporteur', 'En cours de livraison', 'Paiement versé au vendeur'],
  };
  if (del === 'Main propre') return {
    labels: ['Commande payée', 'Rendez-vous accepté', 'Rendez-vous fixé', 'Remis en main propre'],
    subs: ['Paiement protégé par Pimoo', 'Le vendeur a confirmé le rendez-vous', 'Rendez-vous samedi 10 h', 'Paiement versé au vendeur'],
  };
  return {
    labels: ['Commande payée', 'Colis expédié', 'Disponible en point relais', 'Récupéré'],
    subs: ['Paiement protégé par Pimoo', 'Colis pris en charge par le transporteur', 'Relais Tabac du Parc · retrait 7 jours', 'Paiement versé au vendeur'],
  };
}

export default function Tracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sale = useStore((s) => s.sales.find((o) => o.id === id));
  const purchase = useStore((s) => s.purchases.find((o) => o.id === id));
  const mine = useStore((s) => s.mine);
  const rate = commissionRate(useStore((s) => s.commission));
  const updateOrder = useStore((s) => s.updateOrder);
  const showToast = useStore((s) => s.showToast);

  const o = sale ?? purchase;
  if (!o) return <Screen><Txt style={{ padding: 20 }}>Commande introuvable.</Txt></Screen>;
  const isSale = !!sale;
  const p = productById(mine, o.pid)!;
  const seller = sellerById(p.sid)!;
  const { labels, subs } = stepsFor(o.del);

  const canConfirm = !isSale && o.status === 2;
  const canShip = isSale && o.status === 0;
  const canRate = !isSale && o.status === 3;
  const canAdvance = o.status < 2 && !canShip;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Suivi" />

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 26, backgroundColor: colors.neutral100 }}>
          <Thumb p={p} size={64} radius={20} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14} weight="semi" {...ellipsis}>{p.title}</Txt>
            <Txt size={13} color={colors.neutral700}>{isSale ? `Acheteur : ${o.buyer}` : seller.name} · {o.del}</Txt>
            <Txt weight="bold">{isSale ? `Tu reçois ${fmt((o.price ?? p.price) * (1 - rate))}` : fmt(o.price ?? p.price)}</Txt>
          </View>
        </View>

        <View style={{ paddingTop: 4, paddingHorizontal: 4 }}>
          {labels.map((l, i) => {
            const done = i <= o.status;
            return (
              <View key={l} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? colors.accent2_600 : colors.bg, borderWidth: 3, borderColor: done ? colors.accent2_600 : colors.neutral400, alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={4} color={colors.bg} />
                  </View>
                  <View style={{ flex: 1, width: 3, minHeight: 30, borderRadius: 2, backgroundColor: i === 3 ? 'transparent' : i < o.status ? colors.accent2_600 : colors.neutral300 }} />
                </View>
                <View style={{ paddingTop: 2, paddingBottom: 18, flex: 1 }}>
                  <Txt weight="bold" color={done ? colors.text : colors.neutral600}>{l}</Txt>
                  <Txt size={13} color={colors.neutral700}>{subs[i]}</Txt>
                </View>
              </View>
            );
          })}
        </View>

        {canConfirm && <PrimaryButton label="J'ai bien reçu le colis" onPress={() => { updateOrder(o.id, { status: 3 }); showToast('Merci ! Le vendeur reçoit son paiement.'); }} />}
        {canShip && <PrimaryButton label="Imprimer le bordereau" onPress={() => { updateOrder(o.id, { status: 1 }); showToast('Bordereau envoyé par e-mail'); }} />}
        {canRate && p.washed && o.washedOk === undefined && (
          <View style={{ padding: 18, borderRadius: 28, backgroundColor: colors.accent100, gap: 10 }}>
            <H size={18}>Le colis était-il lavé et plié ?</H>
            <Txt size={13} color={colors.accent800}>{seller.name} l'a promis sur l'annonce. Ta réponse aide les autres parents.</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton label="Oui 👍" height={44} size={15} onPress={() => { updateOrder(o.id, { washedOk: true }); showToast('Merci, badge confirmé !'); }} style={{ flex: 1 }} />
              <OutlineButton label="Pas vraiment" height={44} size={15} onPress={() => { updateOrder(o.id, { washedOk: false }); showToast('Merci, on le signale au vendeur'); }} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        {canRate && (
          <View style={{ padding: 18, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', gap: 10 }}>
            <H size={18}>Note {seller.name}</H>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} hitSlop={4} onPress={() => { updateOrder(o.id, { rating: n }); showToast('Merci pour ton avis'); }} style={{ padding: 2 }} accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}>
                  <Star size={32} strokeWidth={2.25} color={colors.accent} fill={n <= (o.rating ?? 0) ? colors.accent : 'none'} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {canAdvance && (
          <Pressable onPress={() => updateOrder(o.id, { status: o.status + 1 })} style={{ alignSelf: 'center' }}>
            <Txt size={12} color={colors.neutral600} style={{ textDecorationLine: 'underline' }}>Démo : passer à l'étape suivante</Txt>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
