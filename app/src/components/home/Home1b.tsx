import { Pressable, View } from 'react-native';

import { AGES, PRODUCTS } from '../../data/catalog';
import { fmt } from '../../lib/format';
import { allProducts, useStore } from '../../store/useStore';
import { colors, GUTTER } from '../../theme/tokens';
import { HeartButton, openProduct, perPiece, tonesFor } from '../products';
import { ellipsis, H, LinkButton, Stripes, Txt } from '../ui';
import { BellButton, CartButton, SearchIconButton, useSearchWith } from './shared';

const BLOB_COLORS: [string, string][] = [
  [colors.accent200, colors.accent800],
  [colors.accent2_200, colors.accent2_800],
  [colors.neutral300, colors.neutral900],
  [colors.accent300, colors.accent900],
];
// Soft shapes on a 76px tile. The third approximates the CSS blob `42% 58% 50% 50% / 50% 45% 55% 50%`.
const BLOB_RADII = [
  { borderRadius: 38 },
  { borderTopLeftRadius: 38, borderTopRightRadius: 38, borderBottomRightRadius: 38, borderBottomLeftRadius: 18 },
  { borderTopLeftRadius: 34, borderTopRightRadius: 42, borderBottomRightRadius: 40, borderBottomLeftRadius: 38 },
  { borderTopLeftRadius: 38, borderTopRightRadius: 18, borderBottomRightRadius: 38, borderBottomLeftRadius: 38 },
];

/** 1b · Éditorial : entrée par âge en formes rondes, lot de la semaine, pièces uniques. */
export function Home1b() {
  const mine = useStore((s) => s.mine);
  const searchWith = useSearchWith();
  const all = allProducts(mine);
  const spotlight = PRODUCTS.find((p) => p.id === 10)!;
  const uniques = all.filter((p) => p.type === 'unique').slice(0, 5);

  const blobs = [
    ...AGES.map((a, i) => {
      const [big, small] = a.split(' ');
      return { key: a, big, small, bg: BLOB_COLORS[i % 4][0], fg: BLOB_COLORS[i % 4][1], radius: BLOB_RADII[i % 4], open: () => searchWith({ f: { ages: [a] } }) };
    }),
    { key: 'lots', big: 'Lots', small: 'tous âges', bg: colors.text, fg: colors.bg, radius: BLOB_RADII[0], open: () => searchWith({ ftype: 'lot' }) },
  ];

  return (
    <View style={{ gap: 26, paddingTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER }}>
        <H size={24} color={colors.accent}>nidoo</H>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SearchIconButton />
          <BellButton />
          <CartButton />
        </View>
      </View>

      <H size={40} lh={1.02} style={{ paddingHorizontal: GUTTER }}>Il grandit vite. Son dressing aussi.</H>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, paddingHorizontal: GUTTER }}>
        {blobs.map((b) => (
          <Pressable key={b.key} onPress={b.open} style={{ width: '25%', alignItems: 'center', gap: 6 }}>
            <View style={[{ width: 76, height: 76, backgroundColor: b.bg, alignItems: 'center', justifyContent: 'center' }, b.radius]}>
              <H size={19} color={b.fg}>{b.big}</H>
            </View>
            <Txt size={12} weight="semi">{b.small}</Txt>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => openProduct(spotlight.id)} style={{ marginHorizontal: GUTTER, borderRadius: 36, backgroundColor: colors.accent, overflow: 'hidden' }}>
        <Stripes tones={tonesFor(spotlight)} label={spotlight.ph} labelPos={{ left: 18, bottom: 14 }} labelSize={10} style={{ height: 190, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }} />
        <View style={{ paddingTop: 18, paddingHorizontal: 22, paddingBottom: 22, gap: 6 }}>
          <Txt size={12} weight="bold" color={colors.bg} style={{ letterSpacing: 0.96, textTransform: 'uppercase' }}>Lot de la semaine · {spotlight.count} pièces</Txt>
          <H size={24} lh={1.1} color={colors.bg}>{spotlight.title}</H>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Txt size={20} weight="bold" color={colors.bg}>{fmt(spotlight.price)}</Txt>
            <Txt size={13} color={colors.bg}>soit {perPiece(spotlight)} la pièce</Txt>
          </View>
        </View>
      </Pressable>

      <View style={{ gap: 6, paddingHorizontal: GUTTER }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H size={21}>Pièces uniques</H>
          <LinkButton label="Tout voir" onPress={() => searchWith({ ftype: 'unique' })} />
        </View>
        {uniques.map((p) => (
          <Pressable key={p.id} onPress={() => openProduct(p.id)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 10 }}>
            <Stripes tones={tonesFor(p)} style={{ width: 76, height: 76, borderRadius: 38 }} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Txt weight="semi" {...ellipsis}>{p.title}</Txt>
              <Txt size={13} color={colors.neutral700}>{p.brand} · {p.size}</Txt>
              <Txt size={12} weight="semi" color={colors.accent2_700}>{p.condition}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Txt weight="bold">{fmt(p.price)}</Txt>
              <HeartButton id={p.id} size={32} icon={15} style={{ backgroundColor: colors.surface }} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
