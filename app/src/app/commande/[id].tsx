import { router, useLocalSearchParams } from 'expo-router';
import { Check, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { BackHeader, Screen } from '../../components/Screen';
import { ellipsis, H, OutlineButton, PrimaryButton, Txt } from '../../components/ui';
import { DELIVERY } from '../../data/catalog';
import { currentUser } from '../../lib/backend';
import { fmt } from '../../lib/format';
import { chatForOrder } from '../../lib/messaging';
import { confirmReception, markShipped } from '../../lib/payments';
import { RealOrder, useStore } from '../../store/useStore';
import { colors, ICON_STROKE } from '../../theme/tokens';

const STEP: Record<RealOrder['status'], number> = { pending: -1, paid: 0, shipped: 1, received: 2, cancelled: -1 };

function steps(o: RealOrder, isSale: boolean) {
  if (o.delivery === 'main') return [
    ['Commande payée', 'Paiement protégé par Pimou'],
    ['Rendez-vous', 'Fixez le lieu et l\'heure dans la messagerie'],
    ['Remis en main propre', isSale ? 'Ton argent est envoyé vers ton compte bancaire' : 'Le vendeur reçoit son paiement'],
  ];
  return [
    ['Commande payée', 'Paiement protégé par Pimou'],
    ['Colis expédié', isSale ? 'Tu as déposé le colis' : 'Le vendeur a déposé le colis'],
    ['Reçu', isSale ? 'Ton argent est envoyé vers ton compte bancaire' : 'Le vendeur reçoit son paiement'],
  ];
}

/** A real order (paid through Stripe), for the buyer or the seller. */
export default function RealOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const o = useStore((s) => s.realOrders.find((x) => x.id === id));
  const people = useStore((s) => s.marketSellers);
  const showToast = useStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  if (!o) return <Screen><BackHeader title="Commande" style={{ margin: 20 }} /><Txt style={{ padding: 20 }}>Commande introuvable.</Txt></Screen>;
  const isSale = o.sellerId === currentUser()?.id;
  const other = people[isSale ? o.buyerId : o.sellerId];
  const step = o.delivery === 'main' && o.status === 'shipped' ? 1 : STEP[o.status];
  const del = DELIVERY.find((d) => d.id === o.delivery)!;

  const run = async (fn: () => Promise<string | null>, ok: string) => {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    showToast(err ?? ok);
  };
  const talk = async () => {
    const cid = await chatForOrder(o);
    if (cid) router.push(`/chat/${cid}`);
  };

  const canShip = isSale && o.status === 'paid' && o.delivery !== 'main';
  const canConfirm = !isSale && (o.status === 'shipped' || (o.status === 'paid' && o.delivery === 'main'));

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title={isSale ? 'Ma vente' : 'Mon achat'} />

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 26, backgroundColor: colors.neutral100 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.neutral200 }}>
            {o.photo && <Image source={{ uri: o.photo }} style={{ width: 64, height: 64 }} />}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14} weight="semi" {...ellipsis}>{o.title}</Txt>
            <Txt size={13} color={colors.neutral700}>{isSale ? 'Acheteur' : 'Vendeur'} : {other?.name ?? 'un parent'} · {del.name}</Txt>
            <Txt weight="bold">{isSale ? `Tu reçois ${fmt(o.price - o.commission)}` : fmt(o.price + o.shipping)}</Txt>
          </View>
        </View>

        {o.status === 'cancelled' ? (
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.accent100 }}>
            <Txt color={colors.accent800}>
              {isSale ? 'Cet article avait déjà été vendu : cet acheteur a été remboursé.' : 'Cet article a été vendu juste avant ton paiement. Tu as été remboursé·e en totalité.'}
            </Txt>
          </View>
        ) : (
          <View style={{ paddingTop: 4, paddingHorizontal: 4 }}>
            {steps(o, isSale).map(([label, sub], i, all) => {
              const done = i <= step;
              return (
                <View key={label} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? colors.accent2_600 : colors.bg, borderWidth: 3, borderColor: done ? colors.accent2_600 : colors.neutral400, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={4} color={colors.bg} />
                    </View>
                    {i < all.length - 1 && <View style={{ flex: 1, width: 3, minHeight: 30, borderRadius: 2, backgroundColor: i < step ? colors.accent2_600 : colors.neutral300 }} />}
                  </View>
                  <View style={{ paddingTop: 2, paddingBottom: 18, flex: 1 }}>
                    <Txt weight="bold" color={done ? colors.text : colors.neutral600}>{label}</Txt>
                    <Txt size={13} color={colors.neutral700}>{sub}</Txt>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {canShip && (
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.surface, gap: 8 }}>
            <H size={18}>À expédier</H>
            {o.delivery === 'domicile' ? (
              <Txt size={14}>Envoie le colis à : <Txt weight="semi">{other?.name ?? "l'acheteur"}, {o.address}</Txt></Txt>
            ) : (
              <Txt size={14}>Dépose le colis dans un point relais. Destinataire : <Txt weight="semi">{other?.name ?? "l'acheteur"}</Txt></Txt>
            )}
            <Txt size={12} color={colors.neutral700}>Bientôt, ton bordereau d'envoi sera créé automatiquement ici.</Txt>
          </View>
        )}
        {isSale && o.status === 'paid' && o.delivery === 'main' && (
          <Txt size={14} color={colors.neutral800}>Fixe le rendez-vous avec {other?.name ?? "l'acheteur"} dans la messagerie. Il ou elle confirmera la remise dans l'appli, et tu seras payé·e.</Txt>
        )}

        {canShip && <PrimaryButton label={busy ? '…' : "J'ai expédié le colis"} onPress={() => run(() => markShipped(o.id), "C'est noté, l'acheteur est prévenu")} disabledLook={busy} />}
        {canConfirm && (
          <PrimaryButton
            label={busy ? '…' : o.delivery === 'main' ? "J'ai bien reçu l'article" : "J'ai bien reçu le colis"}
            onPress={() => run(() => confirmReception(o.id), 'Merci ! Le vendeur reçoit son paiement.')}
            disabledLook={busy}
          />
        )}
        {canConfirm && <Txt size={12} color={colors.neutral700}>Confirme seulement quand tu as l'article entre les mains : c'est ce qui déclenche le paiement du vendeur.</Txt>}
        {o.status === 'received' && (
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
            <Txt color={colors.accent2_800}>{isSale ? `Bravo pour ta vente ! ${fmt(o.price - o.commission)} sont en route vers ton compte bancaire.` : 'Commande terminée. Merci d\'avoir donné une seconde vie à ce vêtement 🌱'}</Txt>
          </View>
        )}

        <OutlineButton label={`Écrire à ${other?.name ?? (isSale ? "l'acheteur" : 'au vendeur')}`} height={48} size={15} onPress={talk} />
        <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <MessageCircle size={14} strokeWidth={ICON_STROKE} color={colors.neutral600} />
          <Txt size={12} color={colors.neutral600}>Un problème avec la commande ? Écris-nous à bonjour@pimou.fr</Txt>
        </View>
      </View>
    </Screen>
  );
}
