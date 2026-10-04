import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, HandCoins, Handshake, Layers, MessageCircle, ShieldCheck, Truck } from 'lucide-react-native';
import { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { DistancePill, formatKm, VerifiedBadge, WashedBadge } from '../../components/Badges';
import { OfferSheet } from '../../components/OfferSheet';
import { HeartButton, openProduct, perPiece, tonesFor } from '../../components/products';
import { BackButton, BottomBar, Screen } from '../../components/Screen';
import { Avatar, ellipsis, H, OutlineButton, PrimaryButton, Stripes, Tag, Txt } from '../../components/ui';
import { HANDOVER_MAX_KM } from '../../data/catalog';
import { fmt } from '../../lib/format';
import { allProducts, isNegotiable, productById, sellerView, useStore } from '../../store/useStore';
import { colors, GUTTER, ICON_STROKE } from '../../theme/tokens';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mine = useStore((s) => s.mine);
  const inCart = useStore((s) => s.cart.includes(Number(id)));
  const addToCart = useStore((s) => s.addToCart);
  const openChatFor = useStore((s) => s.openChatFor);
  const showToast = useStore((s) => s.showToast);
  const offer = useStore((s) => s.offers[Number(id)]);
  const meVerified = useStore((s) => s.meVerified);
  const acceptCounter = useStore((s) => s.acceptCounter);
  const [offerOpen, setOfferOpen] = useState(false);
  const { width } = useWindowDimensions();
  const [photo, setPhoto] = useState(0);

  const p = productById(mine, Number(id));
  if (!p) return <Screen><Txt style={{ padding: GUTTER }}>Annonce introuvable.</Txt></Screen>;

  const seller = sellerView({ meVerified }, p.sid)!;
  const nearby = seller.distanceKm <= HANDOVER_MAX_KM;
  const isLot = p.type === 'lot';
  const isMine = p.sid === 'me';
  const negotiable = isNegotiable(p);
  const accepted = offer?.status === 'accepted';
  const photoNames = isLot ? ["vue d'ensemble du lot", ...(p.contents ?? []).map((c) => c.n.toLowerCase()), 'étiquettes'] : ['vue de face', 'vue de dos', 'étiquette'];
  const nPhotos = isLot ? 5 : 3;
  const photoW = width - 24;
  const similar = allProducts(mine).filter((x) => x.age === p.age && x.id !== p.id).slice(0, 6);
  const specs = [
    ['Âge / taille', p.size], ['Pour', p.gender], ['Marque', p.brand],
    ['Saison', p.season], ['Couleur', p.color], ['État', p.condition],
  ];
  const desc = isLot
    ? `Lot complet en ${p.size}, lavé et plié. Non fumeur, sans animaux. Vendu en une fois uniquement.`
    : `Portée quelques fois, sans tache ni accroc. Taille ${p.size}, coupe normale.`;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / photoW));

  const cta = () => {
    if (inCart) { router.push('/cart'); return; }
    addToCart(p.id);
    showToast('Ajouté au panier');
  };

  const bottom = (
    <BottomBar>
      {isMine ? (
        <View style={{ flex: 1, height: 54, borderRadius: 999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Txt weight="semi">C'est ton annonce</Txt>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => router.push(`/chat/${openChatFor(p.sid, p.id)}`)}
            accessibilityLabel="Écrire au vendeur"
            style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageCircle size={22} strokeWidth={ICON_STROKE} color={colors.text} />
          </Pressable>
          {negotiable && !accepted && !inCart && (
            <OutlineButton
              label={offer ? 'Mon offre' : 'Faire une offre'}
              size={15}
              onPress={() => (offer ? router.push(`/chat/${offer.cid}`) : setOfferOpen(true))}
              style={{ flex: 1, paddingHorizontal: 10 }}
            />
          )}
          <PrimaryButton
            label={inCart ? 'Voir le panier' : accepted ? `Acheter à ${fmt(offer.amount)}` : negotiable ? 'Acheter' : isLot ? 'Acheter le lot' : 'Ajouter au panier'}
            size={negotiable && !accepted && !inCart ? 15 : 17}
            onPress={cta}
            style={{ flex: 1, paddingHorizontal: 10 }}
          />
        </>
      )}
    </BottomBar>
  );

  return (
    <Screen bottom={bottom}>
      <View style={{ gap: 18 }}>
        <View style={{ marginHorizontal: 12, height: 400, borderRadius: 36, overflow: 'hidden' }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} scrollEventThrottle={16}>
            {Array.from({ length: nPhotos }, (_, i) => (
              <Stripes
                key={i}
                tones={tonesFor(p)}
                label={`photo ${i + 1}/${nPhotos} · ${photoNames[i] ?? 'détail'}`}
                labelPos={{ left: 20, bottom: 44 }}
                labelSize={10}
                style={{ width: photoW, height: 400 }}
              />
            ))}
          </ScrollView>
          <View style={{ position: 'absolute', top: 12, left: 12 }}><BackButton bg={colors.neutral100} /></View>
          <HeartButton id={p.id} size={44} icon={20} style={{ position: 'absolute', top: 12, right: 12 }} />
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 18, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: nPhotos }, (_, i) => (
              <View key={i} style={{ width: i === photo ? 22 : 7, height: 7, borderRadius: 999, backgroundColor: i === photo ? colors.text : colors.neutral400 }} />
            ))}
          </View>
        </View>

        <View style={{ gap: 10, paddingHorizontal: GUTTER }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {isLot
              ? <Tag label={`Lot de ${p.count} pièces`} bg={colors.text} fg={colors.bg} size={12} style={{ paddingHorizontal: 12 }} />
              : <Tag label="Pièce unique" bg={colors.accent100} fg={colors.accent800} size={12} style={{ paddingHorizontal: 12 }} />}
            <Pressable onPress={() => router.push(`/conditions?focus=${encodeURIComponent(p.condition)}`)} accessibilityHint="Ouvre le guide des états">
              <Tag label={`${p.condition}  ⓘ`} bg={colors.accent2_100} fg={colors.accent2_800} size={12} weight="semi" style={{ paddingHorizontal: 12 }} />
            </Pressable>
            {p.washed && <WashedBadge />}
          </View>
          <H size={26}>{p.title}</H>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Txt size={26} weight="bold">{fmt(p.price)}</Txt>
            {isLot && <Txt size={14} weight="semi" color={colors.accent2_700}>soit {perPiece(p)} la pièce</Txt>}
          </View>
          {negotiable && !offer && (
            <Pressable onPress={() => setOfferOpen(true)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.accent2_100 }}>
              <HandCoins size={16} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
              <Txt size={13} weight="semi" color={colors.accent2_800}>Prix négociable · fais une offre</Txt>
            </Pressable>
          )}
          {offer && (
            <View style={{ padding: 14, borderRadius: 22, backgroundColor: accepted ? colors.accent2_100 : colors.accent100, gap: 8 }}>
              <Txt size={14} weight="semi" color={accepted ? colors.accent2_800 : colors.accent800}>
                {offer.status === 'pending' && `Offre envoyée : ${fmt(offer.amount)} · en attente de ${seller.name}`}
                {offer.status === 'countered' && `${seller.name} te propose ${fmt(offer.counter!)} (ton offre : ${fmt(offer.amount)})`}
                {accepted && `Offre acceptée : tu paies ${fmt(offer.amount)} au lieu de ${fmt(p.price)}`}
              </Txt>
              {offer.status === 'countered' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PrimaryButton label={`Accepter ${fmt(offer.counter!)}`} height={42} size={15} onPress={() => acceptCounter(p.id)} style={{ flex: 1 }} />
                  <OutlineButton label="Répondre" height={42} size={15} onPress={() => router.push(`/chat/${offer.cid}`)} />
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: GUTTER }}>
          {specs.map(([k, v]) => (
            <View key={k} style={{ width: (width - GUTTER * 2 - 8) / 2, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface }}>
              <Txt size={11} color={colors.neutral700} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>{k}</Txt>
              <Txt size={14} weight="semi" {...ellipsis}>{v}</Txt>
            </View>
          ))}
        </View>

        {isLot && (
          <View style={{ marginHorizontal: GUTTER, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.neutral100, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Layers size={20} strokeWidth={ICON_STROKE} color={colors.text} />
              <H size={18}>Contenu du lot</H>
            </View>
            {(p.contents ?? []).map((c) => (
              <View key={c.n} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                <Txt size={14}>{c.n}</Txt>
                <Txt size={14} color={colors.neutral700}>× {c.q}</Txt>
              </View>
            ))}
            <Txt size={13} color={colors.neutral700}>Vendu en une seule fois, tout le lot ensemble.</Txt>
          </View>
        )}

        <Txt color={colors.neutral800} style={{ paddingHorizontal: GUTTER }}>{desc}</Txt>

        <Pressable
          onPress={() => router.push(`/seller/${p.sid}`)}
          style={{ marginHorizontal: GUTTER, padding: 14, borderRadius: 28, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Avatar init={seller.init} size={48} font={20} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold">{seller.name}</Txt>
            <Txt size={13} color={colors.neutral700}>★ {seller.rating} · {seller.reviews} avis · {seller.city}</Txt>
            {(seller.verified || !isMine) && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {seller.verified && <VerifiedBadge small />}
                {!isMine && <DistancePill seller={seller} small />}
              </View>
            )}
          </View>
          <ChevronRight size={20} strokeWidth={ICON_STROKE} color={colors.text} />
        </Pressable>

        <View style={{ marginHorizontal: GUTTER, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <ShieldCheck size={20} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
            <Txt size={14} style={{ flex: 1 }}>Paiement protégé, versé au vendeur après réception</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Truck size={20} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
            <Txt size={14} style={{ flex: 1 }}>Point relais 3,90 € · Domicile 5,90 €{nearby ? ' · Main propre' : ''}</Txt>
          </View>
          {!isMine && (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Handshake size={20} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
              <Txt size={14} style={{ flex: 1 }}>
                {nearby ? `Remise en main propre possible, à ${formatKm(seller.distanceKm)} de chez toi` : `Trop loin pour une remise en main propre (${formatKm(seller.distanceKm)})`}
              </Txt>
            </View>
          )}
        </View>

        {similar.length > 0 && (
          <View style={{ gap: 12 }}>
            <H size={20} style={{ paddingHorizontal: GUTTER }}>Dans la même taille</H>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER }}>
              {similar.map((x) => (
                <Pressable key={x.id} onPress={() => openProduct(x.id)} style={{ width: 140, gap: 4 }}>
                  <Stripes tones={tonesFor(x)} style={{ height: 170, borderRadius: 22 }} />
                  <Txt size={14} weight="bold">{fmt(x.price)}</Txt>
                  <Txt size={12} {...ellipsis}>{x.title}</Txt>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {negotiable && <OfferSheet p={p} visible={offerOpen} onClose={() => setOfferOpen(false)} />}
    </Screen>
  );
}
