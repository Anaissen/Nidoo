import { router } from 'expo-router';
import { Layers, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { KIDS } from '../../data/catalog';
import { fmt, plural } from '../../lib/format';
import { allProducts, useStore } from '../../store/useStore';
import { colors, GUTTER, ICON_STROKE, shadows } from '../../theme/tokens';
import { HeartButton, LotBadge, openProduct, ProductGrid, tonesFor } from '../products';
import { ellipsis, H, LinkButton, Segmented, Stripes, Txt } from '../ui';
import { CartButton, startLotListing } from './shared';

/** 1c · Par enfant : profils Léa / Tom, flux à la bonne taille, filtre Tout / Pièces / Lots. */
export function Home1c() {
  const mine = useStore((s) => s.mine);
  const kidIdx = useStore((s) => s.kidIdx);
  const homeType = useStore((s) => s.homeType);
  const set = useStore((s) => s.set);
  const { width } = useWindowDimensions();
  const tile = (width - GUTTER * 2 - 12) / 2;

  const kid = KIDS[kidIdx];
  const feed = allProducts(mine).filter((p) =>
    p.age === kid.age && (p.gender === kid.g || p.gender === 'Mixte') && (homeType === 'all' || p.type === homeType));

  return (
    <View style={{ gap: 20, paddingTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER }}>
        <H size={26} style={{ flex: 1, paddingRight: 8 }}>Pour qui aujourd'hui ?</H>
        <CartButton />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER }}>
        {KIDS.map((k, i) => {
          const on = i === kidIdx;
          return (
            <Pressable
              key={k.name}
              onPress={() => set({ kidIdx: i })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 60, paddingLeft: 8, paddingRight: 18, borderRadius: 999, backgroundColor: on ? colors.text : colors.neutral100 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: k.avatar, alignItems: 'center', justifyContent: 'center' }}>
                <H size={18}>{k.init}</H>
              </View>
              <View>
                <Txt weight="bold" lh={1.15} color={on ? colors.bg : colors.text}>{k.name}</Txt>
                <Txt size={12} lh={1.15} color={on ? colors.bg : colors.text}>{k.age}</Txt>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => router.push('/onboarding?kids=1')}
          accessibilityLabel="Ajouter un enfant"
          style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.neutral400, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} strokeWidth={ICON_STROKE} color={colors.neutral700} />
        </Pressable>
      </ScrollView>

      <Segmented
        style={{ marginHorizontal: GUTTER }}
        options={[['all', 'Tout'], ['unique', 'Pièces'], ['lot', 'Lots']]}
        value={homeType}
        onChange={(v) => set({ homeType: v })}
      />

      <Txt size={14} color={colors.neutral800} style={{ paddingHorizontal: GUTTER }}>
        {plural(feed.length, 'article')} en {kid.age} pour {kid.name}
      </Txt>

      {feed.length > 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <ProductGrid
            items={feed}
            render={(p) => (
              <Pressable onPress={() => openProduct(p.id)} style={{ gap: 5 }}>
                {/* Arch-shaped photo (50% 50% 24px 24px); the heart overlaps the curve, so it sits outside the clip. */}
                <View style={{ aspectRatio: 1 }}>
                  <Stripes
                    tones={tonesFor(p)}
                    label={p.ph}
                    labelPos={{ left: 14, bottom: 12 }}
                    style={{ flex: 1, borderTopLeftRadius: tile / 2, borderTopRightRadius: tile / 2, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                  />
                  {p.type === 'lot' && <LotBadge label={`Lot · ${p.count}`} bg={colors.accent2_700} fg={colors.neutral100} style={{ bottom: 10, right: 10 }} />}
                  <HeartButton id={p.id} style={{ position: 'absolute', top: 4, right: 4, boxShadow: shadows.sm }} />
                </View>
                <Txt size={15} weight="bold" style={{ paddingLeft: 2 }}>{fmt(p.price)}</Txt>
                <Txt size={13} lh={1.3} style={{ paddingLeft: 2 }} {...ellipsis}>{p.title}</Txt>
                <Txt size={12} color={colors.neutral700} style={{ paddingLeft: 2 }} {...ellipsis}>{p.brand} · {p.condition}</Txt>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <View style={{ marginHorizontal: GUTTER, padding: 24, borderRadius: 28, backgroundColor: colors.surface }}>
          <Txt color={colors.neutral800} style={{ textAlign: 'center' }}>Rien pour l'instant dans cette catégorie. Active une alerte dans la recherche.</Txt>
        </View>
      )}

      <View style={{ marginHorizontal: GUTTER, borderRadius: 32, backgroundColor: colors.accent100, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent300, alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={28} strokeWidth={ICON_STROKE} color={colors.accent800} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <H size={18} lh={1.15}>{kid.name} ne rentre plus dans le {kid.prev} ?</H>
          <LinkButton label="Revendre en lot →" weight="bold" onPress={startLotListing} />
        </View>
      </View>
    </View>
  );
}
