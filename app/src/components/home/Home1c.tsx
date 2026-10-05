import { router } from 'expo-router';
import { ChevronRight, Layers, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { AGES } from '../../data/catalog';

import { fmt, plural } from '../../lib/format';
import { ageLabel, birthdayNote, nextSize, prevSize } from '../../lib/kids';
import { allProducts, useStore } from '../../store/useStore';
import { colors, GUTTER, ICON_STROKE, shadows } from '../../theme/tokens';
import { KidAvatar } from '../KidAvatar';
import { GrowAlertCard, WardrobeCard } from '../KidCards';
import { Logo } from '../Logo';
import { HeartButton, LotBadge, openProduct, ProductGrid, ProductTile, tonesFor } from '../products';
import { Chip, ellipsis, H, LinkButton, Segmented, Stripes, Txt } from '../ui';
import { BellButton, CartButton } from './shared';

/** activeKidId value for the no-passport "Pour offrir" feed. */
export const GIFT = 'gift';

const pressScale = ({ pressed }: { pressed: boolean }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] });

/** 1c · Par enfant : chaque passeport donne un flux à sa taille, ses goûts et ses couleurs. */
export function Home1c() {
  const mine = useStore((s) => s.mine);
  const kids = useStore((s) => s.kids);
  const activeKidId = useStore((s) => s.activeKidId);
  const homeType = useStore((s) => s.homeType);
  const set = useStore((s) => s.set);
  const saveKid = useStore((s) => s.saveKid);
  const { width } = useWindowDimensions();
  const tile = (width - GUTTER * 2 - 12) / 2;

  const [giftSize, setGiftSize] = useState<string | null>(null);
  // "Pour offrir" (or no passport at all): browse every size without a child's profile.
  const kid = activeKidId === GIFT ? undefined : kids.find((k) => k.id === activeKidId) ?? kids[0];

  const header = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER }}>
        <Logo size={26} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <BellButton />
          <CartButton />
        </View>
      </View>
      <H size={26} style={{ paddingHorizontal: GUTTER, marginTop: -6 }}>Pour qui aujourd'hui ?</H>
    </>
  );

  const kidRow = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER }}>
        {kids.map((k) => {
          const on = k.id === kid?.id;
          return (
            <Pressable
              key={k.id}
              onPress={() => set({ activeKidId: k.id })}
              onLongPress={() => router.push(`/passport/${k.id}`)}
              style={(st) => [pressScale(st), { flexDirection: 'row', alignItems: 'center', gap: 10, height: 60, paddingLeft: 8, paddingRight: 18, borderRadius: 999, backgroundColor: on ? colors.text : colors.neutral100 }]}
            >
              <KidAvatar kid={k} />
              <View>
                <Txt weight="bold" lh={1.15} color={on ? colors.bg : colors.text}>{k.name}</Txt>
                <Txt size={12} lh={1.15} color={on ? colors.bg : colors.text}>{k.size}</Txt>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => set({ activeKidId: GIFT })}
          style={(st) => [pressScale(st), { flexDirection: 'row', alignItems: 'center', gap: 8, height: 60, paddingLeft: 8, paddingRight: 18, borderRadius: 999, backgroundColor: !kid ? colors.text : colors.neutral100 }]}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent200, alignItems: 'center', justifyContent: 'center' }}><Txt size={22} lh={1.15}>🎁</Txt></View>
          <View>
            <Txt weight="bold" lh={1.15} color={!kid ? colors.bg : colors.text}>Pour offrir</Txt>
            <Txt size={12} lh={1.15} color={!kid ? colors.bg : colors.text}>toutes tailles</Txt>
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push('/passport/edit')}
          accessibilityLabel="Ajouter un enfant"
          style={(st) => [pressScale(st), { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.neutral400, alignItems: 'center', justifyContent: 'center' }]}
        >
          <Plus size={20} strokeWidth={ICON_STROKE} color={colors.neutral700} />
        </Pressable>
    </ScrollView>
  );

  if (!kid) {
    const giftFeed = allProducts(mine).filter((p) => (!giftSize || p.age === giftSize) && (homeType === 'all' || p.type === homeType));
    return (
      <View style={{ gap: 20, paddingTop: 4 }}>
        {header}
        {kidRow}
        <View style={{ marginHorizontal: GUTTER, padding: 18, borderRadius: 28, backgroundColor: colors.accent100, gap: 6 }}>
          <H size={20} lh={1.15}>Pas besoin d'avoir des enfants</H>
          <Txt size={14} color={colors.neutral800}>Un cadeau de naissance, un filleul, des neveux… Choisis une taille et déniche. Tu peux aussi créer un passeport pour l'enfant à qui tu offres.</Txt>
          <LinkButton label="Créer un passeport →" weight="bold" onPress={() => router.push('/passport/edit')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
          {[null, ...AGES].map((a) => (
            <Chip key={a ?? 'all'} label={a ?? 'Toutes tailles'} on={giftSize === a} onPress={() => setGiftSize(a)} />
          ))}
        </ScrollView>
        <Segmented style={{ marginHorizontal: GUTTER }} options={[['all', 'Tout'], ['unique', 'Pièces'], ['lot', 'Les lots']]} value={homeType} onChange={(v) => set({ homeType: v })} />
        <Txt size={14} color={colors.neutral800} style={{ paddingHorizontal: GUTTER }}>{plural(giftFeed.length, 'article')}{giftSize ? ` en ${giftSize}` : ''}</Txt>
        <View style={{ paddingHorizontal: GUTTER }}>
          <ProductGrid items={giftFeed} render={(p) => <ProductTile p={p} />} />
        </View>
      </View>
    );
  }

  const sizes = kid.showNextSize ? [kid.size, nextSize(kid.size)] : [kid.size];
  const isFav = (color: string) => kid.favColors.includes(color);
  const feed = allProducts(mine)
    .filter((p) => sizes.includes(p.age)
      && (kid.gender === 'Mixte' || p.gender === kid.gender || p.gender === 'Mixte')
      && (homeType === 'all' || p.type === homeType))
    // Their favourite colours first.
    .sort((a, b) => Number(isFav(b.color)) - Number(isFav(a.color)));
  const birthday = birthdayNote(kid);
  const prev = prevSize(kid.size);
  const details = [`porte du ${kid.size}`, kid.heightCm && `${kid.heightCm} cm`, kid.shoeSize && `pointure ${kid.shoeSize}`].filter(Boolean).join(' · ');

  return (
    <View style={{ gap: 20, paddingTop: 4 }}>
      {header}

      {kidRow}

      {/* Passport summary — the personal touch. */}
      <Pressable
        onPress={() => router.push(`/passport/${kid.id}`)}
        style={(st) => [pressScale(st), { marginHorizontal: GUTTER, padding: 16, borderRadius: 28, backgroundColor: colors.neutral100, boxShadow: shadows.sm, gap: 10 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <KidAvatar kid={kid} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={11} weight="bold" color={colors.accent700} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>Passeport de {kid.name}</Txt>
            <H size={20} lh={1.15}>{ageLabel(kid)}</H>
            <Txt size={13} color={colors.neutral700} {...ellipsis}>{details}</Txt>
          </View>
          <ChevronRight size={20} strokeWidth={ICON_STROKE} color={colors.text} />
        </View>
        {birthday && (
          <View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.accent100 }}>
            <Txt size={13} weight="semi" color={colors.accent800}>{birthday}</Txt>
          </View>
        )}
        {(kid.favColors.length > 0 || kid.styles.length > 0) && (
          <Txt size={13} color={colors.neutral800} {...ellipsis}>
            Aime : {[...kid.favColors, ...kid.styles].join(', ').toLowerCase()}
          </Txt>
        )}
      </Pressable>

      <GrowAlertCard kid={kid} />
      <WardrobeCard kid={kid} />

      <View style={{ gap: 10, paddingHorizontal: GUTTER }}>
        <Segmented options={[['all', 'Tout'], ['unique', 'Pièces'], ['lot', 'Les lots']]} value={homeType} onChange={(v) => set({ homeType: v })} />
        <Pressable
          onPress={() => saveKid({ ...kid, showNextSize: !kid.showNextSize })}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: kid.showNextSize ? colors.accent2_700 : colors.accent2_100 }}
        >
          <Txt size={13} weight="semi" color={kid.showNextSize ? colors.neutral100 : colors.accent2_800}>
            {kid.showNextSize ? '✓ ' : '+ '}Voir aussi la taille au-dessus ({nextSize(kid.size)})
          </Txt>
        </Pressable>
      </View>

      <Txt size={14} color={colors.neutral800} style={{ paddingHorizontal: GUTTER }}>
        {plural(feed.length, 'article')} pour {kid.name}, en {sizes.join(' et ')}
      </Txt>

      {feed.length > 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <ProductGrid
            items={feed}
            render={(p) => (
              <Pressable onPress={() => openProduct(p.id)} style={(st) => [pressScale(st), { gap: 5 }]}>
                {/* Arch-shaped photo (50% 50% 24px 24px); the heart overlaps the curve, so it sits outside the clip. */}
                <View style={{ aspectRatio: 1 }}>
                  <Stripes
                    tones={tonesFor(p)}
                    label={p.ph}
                    labelPos={{ left: 14, bottom: 12 }}
                    style={{ flex: 1, borderTopLeftRadius: tile / 2, borderTopRightRadius: tile / 2, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                  />
                  {p.type === 'lot' && <LotBadge label={`Lot · ${p.count}`} bg={colors.accent2_700} fg={colors.neutral100} style={{ bottom: 10, right: 10 }} />}
                  {isFav(p.color) && <LotBadge label="♥ sa couleur" bg={colors.accent100} fg={colors.accent800} style={{ top: 6, left: 4 }} />}
                  <HeartButton id={p.id} style={{ position: 'absolute', top: 4, right: 4, boxShadow: shadows.sm }} />
                </View>
                <Txt size={15} weight="bold" style={{ paddingLeft: 2 }}>{fmt(p.price)}</Txt>
                <Txt size={13} lh={1.3} style={{ paddingLeft: 2 }} {...ellipsis}>{p.title}</Txt>
                <Txt size={12} color={colors.neutral700} style={{ paddingLeft: 2 }} {...ellipsis}>{p.size} · {p.brand}</Txt>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <View style={{ marginHorizontal: GUTTER, padding: 24, borderRadius: 28, backgroundColor: colors.surface, gap: 12, alignItems: 'center' }}>
          <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Rien pour l'instant à sa taille dans cette catégorie.</Txt>
          {!kid.showNextSize && <LinkButton label={`Voir aussi le ${nextSize(kid.size)}`} onPress={() => saveKid({ ...kid, showNextSize: true })} />}
        </View>
      )}

      {prev && (
        <View style={{ marginHorizontal: GUTTER, borderRadius: 32, backgroundColor: colors.accent100, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent300, alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={28} strokeWidth={ICON_STROKE} color={colors.accent800} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <H size={18} lh={1.15}>{kid.name} ne rentre plus dans le {prev} ?</H>
            <LinkButton label="Revendre en lot →" weight="bold" onPress={() => router.push(`/sell?type=lot&age=${encodeURIComponent(prev)}`)} />
          </View>
        </View>
      )}
    </View>
  );
}
