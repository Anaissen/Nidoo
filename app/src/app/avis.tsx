import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { ellipsis, H, PrimaryButton, Segmented, Txt } from '../components/ui';
import { currentUser } from '../lib/backend';
import { plural } from '../lib/format';
import { loadSellerReviews, Review, stars } from '../lib/reviews';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** "Mes avis": what buyers said about the parent's sales, and what the parent wrote about their purchases. */
export default function MyReviews() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'recus' | 'laisses'>(params.tab === 'laisses' ? 'laisses' : 'recus');
  const signedIn = useStore((s) => s.signedIn);
  const myCard = useStore((s) => s.myCard);
  const realOrders = useStore((s) => s.realOrders);
  const orderReviews = useStore((s) => s.orderReviews);
  const people = useStore((s) => s.marketSellers);
  const me = signedIn ? currentUser()?.id : undefined;
  const [received, setReceived] = useState<(Review & { who: string })[] | null>(null);

  // A review of a sale comes in or changes (the orders follow it live): the list follows.
  const salesReviews = Object.values(orderReviews).filter((r) => r.sellerId === me).map((r) => `${r.orderId}${r.rating}${r.comment}`).join('|');
  useEffect(() => {
    if (me) void loadSellerReviews(me).then(setReceived);
  }, [me, salesReviews]);

  if (!signedIn) {
    return (
      <Screen contentStyle={{ paddingHorizontal: 20 }}>
        <View style={{ gap: 18, paddingTop: 4 }}>
          <BackHeader title="Mes avis" />
          <Txt color={colors.neutral800}>Connecte-toi pour voir les avis sur tes ventes et ceux que tu as laissés.</Txt>
          <PrimaryButton label="Me connecter" height={50} size={16} onPress={() => router.push('/login')} />
        </View>
      </Screen>
    );
  }

  const open = (orderId: string) => { if (realOrders.some((o) => o.id === orderId)) router.push(`/commande/${orderId}`); };
  const bought = realOrders.filter((o) => o.buyerId === me && o.status === 'received');
  const left = bought.filter((o) => orderReviews[o.id]).sort((a, b) => orderReviews[b.id].createdAt.localeCompare(orderReviews[a.id].createdAt));
  const toRate = bought.filter((o) => !orderReviews[o.id]);
  const name = (id: string) => people[id]?.name ?? 'Un parent';

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 14, paddingTop: 4 }}>
        <BackHeader title="Mes avis" />
        <Segmented options={[['recus', 'Reçus'], ['laisses', 'Laissés']]} value={tab} onChange={setTab} />

        {tab === 'recus' ? (
          <>
            <Txt size={13} color={colors.neutral700}>Ce que les acheteurs pensent de tes ventes. Les autres parents les voient sur ton profil.</Txt>
            {!!myCard?.reviews && (
              <View style={{ padding: 18, borderRadius: 28, backgroundColor: colors.accent100, gap: 2, alignItems: 'center' }}>
                <H size={34} color={colors.accent800}>★ {myCard.rating}</H>
                <Txt size={14} color={colors.accent800}>{myCard.reviews} avis · {plural(myCard.sales, 'vente')}</Txt>
                {myCard.washedConfirms > 0 && <Txt size={13} color={colors.accent800}>Lavé et plié confirmé par {plural(myCard.washedConfirms, 'acheteur')}</Txt>}
              </View>
            )}
            {received === null && <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />}
            {received?.map((r) => <ReviewCard key={r.orderId} who={r.who} title={realOrders.find((o) => o.id === r.orderId)?.title} r={r} onPress={() => open(r.orderId)} />)}
            {received?.length === 0 && <Empty text="Pas encore d'avis. Quand un acheteur a reçu ton article, il peut te noter : son avis apparaît ici et sur ton profil." />}
          </>
        ) : (
          <>
            <Txt size={13} color={colors.neutral700}>Tes notes sur les vendeurs, après chaque achat reçu. Les autres parents les voient sur le profil du vendeur.</Txt>
            {toRate.map((o) => (
              <Pressable key={o.id} onPress={() => router.push(`/commande/${o.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, backgroundColor: colors.accent100 }}>
                <Txt size={22}>⭐</Txt>
                <Txt size={14} color={colors.accent800} style={{ flex: 1 }}>Note {name(o.sellerId)} pour « {o.title} »</Txt>
                <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.accent800} />
              </Pressable>
            ))}
            {left.map((o) => <ReviewCard key={o.id} who={name(o.sellerId)} title={o.title} r={orderReviews[o.id]} onPress={() => open(o.id)} />)}
            {!!left.length && <Txt size={12} color={colors.neutral600}>Touche un avis pour le modifier.</Txt>}
            {!left.length && !toRate.length && <Empty text="Tu n'as pas encore laissé d'avis. Quand tu as reçu un achat, tu peux noter le vendeur depuis ta commande." />}
          </>
        )}
      </View>
    </Screen>
  );
}

/** One review: who, the stars, the article, the words, the date. */
function ReviewCard({ who, title, r, onPress }: { who: string; title?: string; r: Review; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 4, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt weight="bold" style={{ flex: 1 }} {...ellipsis}>{who}</Txt>
        <Txt size={15} color={colors.accent700} accessibilityLabel={`${r.rating} étoile${r.rating > 1 ? 's' : ''} sur 5`}>{stars(r.rating)}</Txt>
      </View>
      {!!title && <Txt size={13} color={colors.neutral700} {...ellipsis}>« {title} »</Txt>}
      {!!r.comment && <Txt size={14} color={colors.neutral800}>{r.comment}</Txt>}
      <Txt size={12} color={colors.neutral600}>{DAY.format(new Date(r.createdAt))}{r.washedOk ? ' · lavé et plié ✓' : ''}</Txt>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 28, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
      <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>{text}</Txt>
    </View>
  );
}
