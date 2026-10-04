import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { Product, TONES } from '../data/catalog';
import { fmt } from '../lib/format';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE, shadows } from '../theme/tokens';
import { ellipsis, Stripes, Tag, Txt } from './ui';

export const tonesFor = (p: Product): [string, string] => TONES[p.color] ?? TONES.Beige;
export const perPiece = (p: Product) => (p.type === 'lot' && p.count ? fmt(p.price / p.count) : '');
export const typeLabel = (p: Product) => (p.type === 'lot' ? `Lot de ${p.count}` : 'Pièce unique');
export const openProduct = (id: number) => router.push(`/product/${id}`);

export function HeartButton({ id, size = 34, icon = 17, style }: { id: number; size?: number; icon?: number; style?: StyleProp<ViewStyle> }) {
  const fav = useStore((s) => s.favs.includes(id));
  const toggle = useStore((s) => s.toggleFav);
  return (
    <Pressable
      hitSlop={6}
      onPress={(e) => { e.stopPropagation?.(); toggle(id); }}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.neutral100, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Heart size={icon} strokeWidth={ICON_STROKE} color={fav ? colors.accent : colors.text} fill={fav ? colors.accent : 'none'} />
    </Pressable>
  );
}

export const LotBadge = ({ label, style, bg = colors.text, fg = colors.bg }: { label: string; style?: StyleProp<ViewStyle>; bg?: string; fg?: string }) => (
  <Tag label={label} bg={bg} fg={fg} style={[{ position: 'absolute' }, style]} />
);

/** Grid tile (4:5 photo, radius 22) used by "Nouveautés", search results, favoris, dressing. */
export function ProductTile({ p, meta = 'size', showHeart = true, showLabel = true }: {
  p: Product; meta?: 'size' | 'sizeOnly' | 'brand'; showHeart?: boolean; showLabel?: boolean;
}) {
  const line = meta === 'brand' ? `${p.brand} · ${p.condition}` : meta === 'sizeOnly' ? p.size : `${p.size} · ${p.condition}`;
  return (
    <Pressable onPress={() => openProduct(p.id)} style={{ flex: 1, minWidth: 0, gap: 5 }}>
      <Stripes tones={tonesFor(p)} label={showLabel ? p.ph ?? 'photo' : undefined} style={{ aspectRatio: 4 / 5, borderRadius: 22 }}>
        {p.type === 'lot' && <LotBadge label={`Lot · ${p.count}`} style={{ top: 10, left: 10 }} />}
        {showHeart && <HeartButton id={p.id} style={{ position: 'absolute', top: 8, right: 8 }} />}
      </Stripes>
      <Txt size={15} weight="bold" style={{ paddingLeft: 2 }}>{fmt(p.price)}</Txt>
      <Txt size={13} lh={1.3} style={{ paddingLeft: 2 }} {...ellipsis}>{p.title}</Txt>
      <Txt size={12} color={colors.neutral700} style={{ paddingLeft: 2 }} {...ellipsis}>{line}</Txt>
    </Pressable>
  );
}

/** Two-column grid with 16px row / 12px column gaps. */
export function ProductGrid({ items, render }: { items: Product[]; render: (p: Product) => React.ReactNode }) {
  const rows: Product[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: 16 }}>
      {rows.map((r) => (
        <View key={r[0].id} style={{ flexDirection: 'row', gap: 12 }}>
          {r.map((p) => <View key={p.id} style={{ flex: 1, minWidth: 0 }}>{render(p)}</View>)}
          {r.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

/** Horizontal "Lots du moment" card, 220 wide. */
export function LotCard({ p }: { p: Product }) {
  return (
    <Pressable onPress={() => openProduct(p.id)} style={{ width: 220, gap: 6 }}>
      <Stripes tones={tonesFor(p)} label={p.ph} style={{ height: 150, borderRadius: 24 }}>
        <LotBadge label={`Lot · ${p.count} pièces`} style={{ top: 10, left: 10 }} />
        <HeartButton id={p.id} style={{ position: 'absolute', top: 8, right: 8 }} />
      </Stripes>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt size={16} weight="bold">{fmt(p.price)}</Txt>
        <Txt size={12} color={colors.neutral700}>{perPiece(p)} / pièce</Txt>
      </View>
      <Txt size={13} {...ellipsis}>{p.title}</Txt>
      <Txt size={12} color={colors.neutral700}>{p.size} · {p.condition}</Txt>
    </Pressable>
  );
}

/** Small thumbnail with stripes (cart, orders, chat header). */
export const Thumb = ({ p, size, radius }: { p: Product; size: number; radius: number }) => (
  <Stripes tones={tonesFor(p)} style={{ width: size, height: size, borderRadius: radius }} />
);

