import { X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AGES, COLORS, CONDS, GENDERS, PRICES, PRODUCTS, SEASONS } from '../data/catalog';
import { FilterKey, filterProducts, useStore } from '../store/useStore';
import { colors, GUTTER, ICON_STROKE, shadows } from '../theme/tokens';
import { Chip, CircleButton, H, OutlineButton, PrimaryButton, Txt } from './ui';

const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort();

const GROUPS: { title: string; key: FilterKey; opts: string[]; dots?: boolean }[] = [
  { title: 'Âge / taille', key: 'ages', opts: [...AGES] },
  { title: 'Pour', key: 'genders', opts: [...GENDERS] },
  { title: 'Saison', key: 'seasons', opts: [...SEASONS] },
  { title: 'État', key: 'conds', opts: [...CONDS] },
  { title: 'Prix', key: 'price', opts: PRICES.map((p) => p.l) },
  { title: 'Marque', key: 'brands', opts: BRANDS },
  { title: 'Couleur', key: 'colors', opts: Object.keys(COLORS), dots: true },
];

export function ColorDot({ name }: { name: string }) {
  const c = COLORS[name];
  const ring = { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.divider, overflow: 'hidden' as const };
  if (Array.isArray(c)) {
    // Multicolore: four quadrants stand in for the conic gradient.
    return (
      <View style={[ring, { flexDirection: 'row', flexWrap: 'wrap' }]}>
        {[c[0], c[1], c[3], c[2]].map((x, i) => <View key={i} style={{ width: '50%', height: '50%', backgroundColor: x }} />)}
      </View>
    );
  }
  return <View style={[ring, { backgroundColor: c }]} />;
}

export function FilterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const f = useStore((s) => s.f);
  const toggle = useStore((s) => s.toggleFilter);
  const clear = useStore((s) => s.clearFilters);
  const count = useStore((s) => filterProducts(s).length);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim }} accessibilityLabel="Fermer" />
        <View style={{ maxHeight: '86%', backgroundColor: colors.bg, borderTopLeftRadius: 36, borderTopRightRadius: 36, boxShadow: shadows.lg }}>
          <View style={{ alignItems: 'center', padding: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 999, backgroundColor: colors.neutral400 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER, paddingBottom: 8 }}>
            <H size={24}>Filtres</H>
            <CircleButton size={40} onPress={onClose} accessibilityLabel="Fermer">
              <X size={18} strokeWidth={ICON_STROKE} color={colors.text} />
            </CircleButton>
          </View>
          <ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: GUTTER, paddingBottom: 16, gap: 18 }}>
            {GROUPS.map((g) => (
              <View key={g.key} style={{ gap: 10 }}>
                <Txt weight="bold">{g.title}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {g.opts.map((o) => (
                    <Chip key={o} label={o} on={f[g.key].includes(o)} onPress={() => toggle(g.key, o)} left={g.dots ? <ColorDot name={o} /> : undefined} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: GUTTER, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: colors.divider }}>
            <OutlineButton label="Effacer" size={16} onPress={clear} />
            <PrimaryButton label={`Voir ${count} articles`} onPress={onClose} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
