import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import type { Product } from '../data/catalog';
import { fmt } from '../lib/format';
import { appIdOf, loadMarket } from '../lib/listings';
import { checkoutStatus, loadOrders } from '../lib/payments';
import { productById, RealOrder, useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

type State = { status: 'checking' | 'pending' | 'paid' | 'cancelled' | 'error'; orders: RealOrder[]; error?: string };

/** Back from Stripe's payment page. */
export default function Paid() {
  const { session_id: sessionId, app } = useLocalSearchParams<{ session_id?: string; app?: string }>();
  const signedIn = useStore((s) => s.signedIn);
  const [st, setSt] = useState<State>({ status: 'checking', orders: [] });

  useEffect(() => {
    if (!sessionId || !signedIn) return;
    let tries = 0, stop = false;
    // Stripe may take a few seconds to confirm a card: ask again for a little while.
    const check = async () => {
      const r = await checkoutStatus(sessionId);
      if (stop) return;
      if (r.error) { setSt({ status: 'error', orders: [], error: r.error }); return; }
      setSt({ status: r.status, orders: r.orders });
      if (r.status === 'paid') {
        // Bought: out of the basket, and ticked in the child's garde-robe (once: the basket no longer has them).
        const s = useStore.getState();
        const inCart = r.orders.filter((o) => o.listingId != null && s.cart.includes(appIdOf(o.listingId)));
        // The listing may already be out of the feed (sold): its title is enough to find the garde-robe line.
        const bought = inCart.filter((o) => o.status === 'paid').map((o) => productById(s.mine, appIdOf(o.listingId!)) ?? ({ type: 'unique', title: o.title } as Product));
        const ticked = s.tickWardrobe(bought);
        const kid = s.kids.find((k) => k.id === s.activeKidId);
        if (ticked && kid) s.showToast(`✓ Coché dans la garde-robe de ${kid.name}`);
        const gone = new Set(inCart.map((o) => appIdOf(o.listingId!)));
        useStore.setState((x) => ({ cart: x.cart.filter((pid) => !gone.has(pid)) }));
        void loadOrders();
        void loadMarket();
      } else if (r.status === 'pending' && ++tries < 8) setTimeout(check, 2500);
    };
    void check();
    return () => { stop = true; };
  }, [sessionId, signedIn]);

  // Opened from the phone app: this page is in the phone's browser, the app takes over.
  if (app && !signedIn) {
    return (
      <Screen centered contentStyle={{ padding: 24 }}>
        <View style={{ gap: 18, alignItems: 'center' }}>
          <Badge kind="paid" />
          <H size={30} style={{ textAlign: 'center' }}>Paiement terminé</H>
          <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Ferme cette page pour revenir dans l'appli Pimou : ta commande t'y attend.</Txt>
        </View>
      </Screen>
    );
  }

  const paid = st.orders.filter((o) => o.status === 'paid');
  const refunded = st.orders.filter((o) => o.status === 'cancelled');
  const total = paid.reduce((n, o) => n + o.price + o.shipping, 0);

  return (
    <Screen centered contentStyle={{ padding: 24 }}>
      <View style={{ gap: 18 }}>
        {st.status === 'checking' && <ActivityIndicator color={colors.accent} size="large" />}
        {st.status === 'checking' && <Txt style={{ textAlign: 'center' }}>{signedIn ? 'On vérifie ton paiement…' : 'Connecte-toi pour voir ta commande.'}</Txt>}

        {st.status === 'paid' && (
          <>
            <Badge kind="paid" />
            <H size={36}>Commande confirmée</H>
            <Txt color={colors.neutral800}>
              Tu as payé {fmt(total)}. Le vendeur a 3 jours pour expédier. Ton argent reste protégé par Pimou jusqu'à ce que tu confirmes la réception.
            </Txt>
            {paid.map((o) => <Txt key={o.id} size={14} weight="semi">✓ {o.title} · {fmt(o.price)}</Txt>)}
            {refunded.length > 0 && (
              <Txt size={14} color={colors.accent700}>
                {refunded.map((o) => `« ${o.title} »`).join(', ')} {refunded.length > 1 ? 'ont' : 'a'} été vendu{refunded.length > 1 ? 's' : ''} juste avant ton paiement : tu es remboursé·e automatiquement.
              </Txt>
            )}
          </>
        )}
        {st.status === 'pending' && (
          <>
            <Badge kind="pending" />
            <H size={30}>Paiement en cours</H>
            <Txt color={colors.neutral800}>Ta banque n'a pas encore confirmé. Tu verras ta commande dans « Mes achats » dès que c'est fait.</Txt>
          </>
        )}
        {(st.status === 'cancelled' || st.status === 'error') && (
          <>
            <Badge kind="cancelled" />
            <H size={30}>{st.status === 'cancelled' ? 'Paiement non abouti' : 'Petit souci'}</H>
            <Txt color={colors.neutral800}>{st.error ?? "Aucun montant n'a été prélevé. Tes articles t'attendent dans ton panier."}</Txt>
          </>
        )}

        {st.status !== 'checking' && (
          <View style={{ gap: 10 }}>
            {st.status === 'paid' || st.status === 'pending'
              ? <PrimaryButton label="Suivre ma commande" onPress={() => router.replace('/orders?tab=achats')} />
              : <PrimaryButton label="Retour au panier" onPress={() => router.replace('/cart')} />}
            <OutlineButton label="Retour à l'accueil" onPress={() => { if (router.canDismiss()) router.dismissAll(); router.replace('/home'); }} />
          </View>
        )}
      </View>
    </Screen>
  );
}

function Badge({ kind }: { kind: 'paid' | 'pending' | 'cancelled' }) {
  const Icon = kind === 'paid' ? Check : kind === 'pending' ? Clock : X;
  const bg = kind === 'paid' ? colors.accent : kind === 'pending' ? colors.accent2_500 : colors.neutral500;
  return (
    <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={44} strokeWidth={ICON_STROKE} color={colors.bg} />
    </View>
  );
}
