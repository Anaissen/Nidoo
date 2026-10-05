import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { FilterSheet } from '../../components/FilterSheet';
import { ProductGrid, ProductTile } from '../../components/products';
import { Screen } from '../../components/Screen';
import { H, OutlineButton, Segmented, Txt } from '../../components/ui';
import { plural } from '../../lib/format';
import { FilterKey, filterProducts, useMarket, useStore } from '../../store/useStore';
import { colors, fonts, GUTTER, ICON_STROKE, shadows } from '../../theme/tokens';

export default function Search() {
  useMarket();
  const [sheet, setSheet] = useState(false);
  const q = useStore((s) => s.q);
  const ftype = useStore((s) => s.ftype);
  const f = useStore((s) => s.f);
  const mine = useStore((s) => s.mine);
  const set = useStore((s) => s.set);
  const toggle = useStore((s) => s.toggleFilter);
  const clear = useStore((s) => s.clearFilters);

  const results = filterProducts({ mine, f, q, ftype });
  const active = (Object.entries(f) as [FilterKey, string[]][]).flatMap(([k, arr]) => arr.map((v) => ({ k, v })));

  return (
    <Screen>
      <View style={{ gap: 14, paddingTop: 4 }}>
        <H size={28} style={{ paddingHorizontal: GUTTER }}>Dénicher</H>

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER }}>
          <View style={{ flex: 1, height: 50, borderRadius: 999, backgroundColor: colors.neutral100, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, boxShadow: shadows.sm }}>
            <SearchIcon size={19} strokeWidth={ICON_STROKE} color={colors.neutral700} />
            <TextInput
              value={q}
              onChangeText={(t) => set({ q: t })}
              placeholder="Qu'est-ce qu'on déniche ?"
              placeholderTextColor={colors.neutral700}
              returnKeyType="search"
              style={{ flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: 0, outlineWidth: 0 }}
            />
          </View>
          <Pressable
            onPress={() => setSheet(true)}
            accessibilityLabel="Filtres"
            style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}
          >
            <SlidersHorizontal size={20} strokeWidth={ICON_STROKE} color={colors.bg} />
            {active.length > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 999, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={11} weight="bold" color={colors.bg} lh={1}>{active.length}</Txt>
              </View>
            )}
          </Pressable>
        </View>

        <Segmented
          style={{ marginHorizontal: GUTTER }}
          height={38}
          size={13}
          options={[['all', 'Tout'], ['unique', 'Pièces uniques'], ['lot', 'Les lots']]}
          value={ftype}
          onChange={(v) => set({ ftype: v })}
        />

        {active.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
            {active.map(({ k, v }) => (
              <Pressable
                key={k + v}
                onPress={() => toggle(k, v)}
                style={{ height: 34, paddingLeft: 14, paddingRight: 10, borderRadius: 999, backgroundColor: colors.accent2_200, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Txt size={13} weight="semi" color={colors.accent2_800}>{v}</Txt>
                <X size={14} strokeWidth={3} color={colors.accent2_800} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Txt size={13} color={colors.neutral700} style={{ paddingHorizontal: GUTTER }}>{plural(results.length, 'article')}</Txt>

        <View style={{ paddingHorizontal: GUTTER }}>
          <ProductGrid items={results} render={(p) => <ProductTile p={p} />} />
        </View>

        {results.length === 0 && (
          <View style={{ marginHorizontal: GUTTER, paddingVertical: 28, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', gap: 10 }}>
            <H size={20}>Aucun article pour l'instant</H>
            <Txt size={14} color={colors.neutral800} style={{ textAlign: 'center' }}>Élargis tes filtres ou crée une alerte, on te prévient dès qu'un article correspond.</Txt>
            <OutlineButton label="Effacer les filtres" height={44} size={15} onPress={clear} />
          </View>
        )}
      </View>
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}
