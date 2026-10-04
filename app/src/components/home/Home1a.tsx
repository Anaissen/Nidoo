import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { AGES } from '../../data/catalog';
import { allProducts, useStore } from '../../store/useStore';
import { colors, GUTTER, ICON_STROKE, shadows } from '../../theme/tokens';
import { LotCard, ProductGrid, ProductTile } from '../products';
import { H, LinkButton, Txt } from '../ui';
import { BellButton, CartButton, startLotListing, useSearchWith } from './shared';

/** 1a · Classique : recherche, raccourcis âge, bannière lot, lots du moment, nouveautés à ta taille. */
export function Home1a() {
  const mine = useStore((s) => s.mine);
  const kidAges = useStore((s) => s.kidAges);
  const searchWith = useSearchWith();
  const all = allProducts(mine);
  const ages = kidAges.length ? kidAges : [...AGES];
  const forYou = all.filter((p) => ages.includes(p.age)).slice(0, 6);
  const lots = all.filter((p) => p.type === 'lot').slice(0, 5);

  return (
    <View style={{ gap: 22, paddingTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Txt size={13} color={colors.neutral700}>Bonjour Élodie</Txt>
          <H size={26} lh={1.1}>Qu'est-ce qu'on déniche ?</H>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <BellButton />
          <CartButton />
        </View>
      </View>

      <Pressable
        onPress={() => router.navigate('/search')}
        style={{ marginHorizontal: GUTTER, height: 52, borderRadius: 999, backgroundColor: colors.neutral100, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, boxShadow: shadows.sm }}
      >
        <Search size={20} strokeWidth={ICON_STROKE} color={colors.neutral700} />
        <Txt color={colors.neutral700}>Body, robe, lot 2 ans…</Txt>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
        {AGES.map((a) => (
          <Pressable
            key={a}
            onPress={() => searchWith({ f: { ages: [a] } })}
            style={({ pressed }) => ({ height: 40, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center', backgroundColor: pressed ? colors.accent200 : colors.accent100 })}
          >
            <Txt size={14} weight="semi" color={colors.accent800}>{a}</Txt>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ marginHorizontal: GUTTER, borderRadius: 32, backgroundColor: colors.accent2_500, padding: 22, gap: 12, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: colors.accent2_400 }} />
        <H size={24} lh={1.1} color={colors.neutral100} style={{ maxWidth: 230 }}>Trop petit ? Vends tout en un lot.</H>
        <Txt size={14} color={colors.neutral100} style={{ maxWidth: 240 }}>Une annonce, une photo de groupe, un prix. C'est fait en 2 minutes.</Txt>
        <Pressable onPress={startLotListing} style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.neutral100, justifyContent: 'center' }}>
          <H size={15} color={colors.accent2_800}>Créer un lot</H>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: GUTTER }}>
          <H size={21}>Lots du moment</H>
          <LinkButton label="Tout voir" onPress={() => searchWith({ ftype: 'lot' })} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER }}>
          {lots.map((p) => <LotCard key={p.id} p={p} />)}
        </ScrollView>
      </View>

      <View style={{ gap: 12, paddingHorizontal: GUTTER }}>
        <H size={21}>Nouveautés à ta taille</H>
        <ProductGrid items={forYou} render={(p) => <ProductTile p={p} />} />
      </View>
    </View>
  );
}
