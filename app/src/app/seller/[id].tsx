import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { DistancePill, VerifiedBadge, WashedBadge } from '../../components/Badges';
import { ProductGrid, ProductTile } from '../../components/products';
import { BackButton, Screen } from '../../components/Screen';
import { Avatar, H, Segmented, Txt } from '../../components/ui';
import { REVIEWS } from '../../data/catalog';
import { requireAccount } from '../../lib/auth';
import { currentUser } from '../../lib/backend';
import { loadSellerReviews, Review, stars } from '../../lib/reviews';
import { chatFor, isRemoteListing } from '../../lib/messaging';
import { allProducts, myListings, sellerView, useMarket, useStore } from '../../store/useStore';
import { colors, GUTTER } from '../../theme/tokens';

export default function SellerScreen() {
  useMarket();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<'items' | 'reviews'>('items');
  const mine = useStore((s) => s.mine);
  const following = useStore((s) => s.following.includes(id));
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openChatFor = useStore((s) => s.openChatFor);

  const meVerified = useStore((s) => s.meVerified);
  const account = useStore((s) => s.account);
  const myCard = useStore((s) => s.myCard);
  const signedIn = useStore((s) => s.signedIn);
  const sel = sellerView({ meVerified, account, myCard }, id);
  // Real parents (and me, logged in): their real reviews. Demo sellers keep the sample ones.
  const realId = id === 'me' ? (signedIn ? currentUser()?.id : undefined) : useStore.getState().marketSellers[id] ? id : undefined;
  const [reviews, setReviews] = useState<(Review & { who: string })[] | null>(null);
  useEffect(() => {
    if (tab === 'reviews' && realId) void loadSellerReviews(realId).then(setReviews);
  }, [tab, realId]);
  if (!sel) return <Screen><Txt style={{ padding: GUTTER }}>Vendeur introuvable.</Txt></Screen>;
  const isMe = id === 'me';
  const items = isMe ? myListings(mine) : allProducts(mine).filter((p) => p.sid === id);

  const stats = [sel.reviews ? [`★ ${sel.rating}`, `${sel.reviews} avis`] : ['Nouveau', 'sur Pimou'], [String(sel.sales), sel.sales === 1 ? 'vente' : 'ventes'], [sel.ship, 'pour expédier']];

  return (
    <Screen>
      <View style={{ gap: 18 }}>
        <View style={{ paddingVertical: 4, paddingHorizontal: 16 }}><BackButton /></View>

        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', paddingHorizontal: GUTTER }}>
          <Avatar init={sel.init} size={84} font={34} />
          <View style={{ gap: 2, flex: 1 }}>
            <H size={26}>{sel.name}</H>
            <Txt size={14} color={colors.neutral700}>{sel.city} · membre depuis {sel.since}</Txt>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {sel.verified && <VerifiedBadge small />}
              {!isMe && <DistancePill seller={sel} small />}
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER }}>
          {stats.map(([big, small]) => (
            <View key={small} style={{ flex: 1, padding: 12, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center' }}>
              <H size={22}>{big}</H>
              <Txt size={12} color={colors.neutral700}>{small}</Txt>
            </View>
          ))}
        </View>

        {sel.washedConfirms > 0 && (
          <View style={{ marginHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 22, backgroundColor: colors.accent100 }}>
            <WashedBadge />
            <Txt size={13} color={colors.accent800} style={{ flex: 1 }}>Confirmé par {sel.washedConfirms} acheteur{sel.washedConfirms > 1 ? 's' : ''} à la réception</Txt>
          </View>
        )}

        {!isMe && (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER }}>
            <Pressable onPress={() => toggleFollow(id)} style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: following ? colors.surface : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <H size={16} color={following ? colors.text : colors.bg}>{following ? 'Abonné·e' : 'Suivre'}</H>
            </Pressable>
            <Pressable onPress={async () => {
              // A real parent: talk about their latest listing. Demo sellers keep their simulated chat.
              const p = items[0];
              if (p && isRemoteListing(p)) {
                if (!requireAccount('écrire à ce parent')) return;
                const cid = await chatFor(p);
                if (cid) router.push(`/chat/${cid}`);
              } else router.push(`/chat/${openChatFor(id, null)}`);
            }} style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
              <H size={16}>Message</H>
            </Pressable>
          </View>
        )}

        <Segmented style={{ marginHorizontal: GUTTER }} height={38} options={[['items', 'Dressing'], ['reviews', 'Avis']]} value={tab} onChange={setTab} />

        {tab === 'items' ? (
          <View style={{ paddingHorizontal: GUTTER }}>
            <ProductGrid items={items} render={(p) => <ProductTile p={p} meta="sizeOnly" showHeart={false} showLabel={false} />} />
          </View>
        ) : (
          <View style={{ gap: 10, paddingHorizontal: GUTTER }}>
            {realId && reviews?.length === 0 && (
              <View style={{ padding: 20, borderRadius: 24, backgroundColor: colors.neutral100 }}>
                <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Pas encore d'avis. Ils arrivent après les premières ventes.</Txt>
              </View>
            )}
            {realId && reviews?.map((r) => (
              <View key={r.orderId} style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="bold">{r.who}</Txt>
                  <Txt size={13} color={colors.accent700}>{stars(r.rating)}</Txt>
                </View>
                {!!r.comment && <Txt size={14} color={colors.neutral800}>{r.comment}</Txt>}
                <Txt size={12} color={colors.neutral600}>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}{r.washedOk ? ' · lavé et plié ✓' : ''}</Txt>
              </View>
            ))}
            {!realId && REVIEWS.map((r) => (
              <View key={r.who} style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt weight="bold">{r.who}</Txt>
                  <Txt size={13} color={colors.accent700}>{r.stars}</Txt>
                </View>
                <Txt size={14} color={colors.neutral800}>{r.text}</Txt>
                <Txt size={12} color={colors.neutral600}>{r.when}</Txt>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
