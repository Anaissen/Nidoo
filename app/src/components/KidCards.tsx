import { router } from 'expo-router';
import { ChevronRight, Sprout } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { WARDROBE_TEMPLATES } from '../data/catalog';
import { growthAlert, Kid } from '../lib/kids';
import { newWardrobe, useStore } from '../store/useStore';
import { colors, GUTTER, ICON_STROKE } from '../theme/tokens';
import { H, OutlineButton, PrimaryButton, Txt } from './ui';

/** "Il grandit": the next size is close — resell the current one as a lot, and shop the next. */
export function GrowAlertCard({ kid, inset = true }: { kid: Kid; inset?: boolean }) {
  const saveKid = useStore((s) => s.saveKid);
  const set = useStore((s) => s.set);
  const alert = growthAlert(kid);
  if (!alert) return null;
  return (
    <View style={{ marginHorizontal: inset ? GUTTER : 0, padding: 18, borderRadius: 28, backgroundColor: colors.accent2_500, gap: 12, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: colors.accent2_400 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.neutral100, alignItems: 'center', justifyContent: 'center' }}>
          <Sprout size={22} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
        </View>
        <Txt size={12} weight="bold" color={colors.neutral100} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>Il grandit !</Txt>
      </View>
      <H size={22} lh={1.12} color={colors.neutral100}>{alert.text}</H>
      <Txt size={14} color={colors.neutral100}>Revends ses {kid.size} d'un coup en lot, et prépare sa nouvelle garde-robe.</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton
          label={`Voir le ${alert.next}`}
          height={44}
          size={15}
          onPress={() => { saveKid({ ...kid, showNextSize: true }); set({ activeKidId: kid.id }); router.navigate('/home'); }}
          style={{ flex: 1, paddingHorizontal: 10 }}
        />
        <OutlineButton
          label="Revendre en lot"
          height={44}
          size={15}
          onPress={() => router.push(`/sell?type=lot&age=${encodeURIComponent(kid.size)}`)}
          style={{ flex: 1, paddingHorizontal: 10, backgroundColor: colors.neutral100, borderColor: 'transparent' }}
        />
      </View>
    </View>
  );
}

/** Progress of the season's garde-robe for this child. */
export function WardrobeCard({ kid, inset = true }: { kid: Kid; inset?: boolean }) {
  const w = useStore((s) => s.wardrobes[kid.id]) ?? newWardrobe();
  const need = w.lines.reduce((a, l) => a + l.need, 0);
  const got = w.lines.reduce((a, l) => a + l.got, 0);
  const pct = need ? got / need : 0;
  const missing = w.lines.filter((l) => l.got < l.need).slice(0, 3).map((l) => l.label.toLowerCase());
  return (
    <Pressable
      onPress={() => router.push(`/wardrobe/${kid.id}`)}
      style={({ pressed }) => ({ marginHorizontal: inset ? GUTTER : 0, padding: 16, borderRadius: 28, backgroundColor: colors.surface, gap: 10, transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt size={11} weight="bold" color={colors.accent700} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>Garde-robe {WARDROBE_TEMPLATES[w.season].title}</Txt>
          <H size={19} lh={1.15}>{got === need ? `Tout est prêt pour ${kid.name} ✓` : `${got} sur ${need} pièces pour ${kid.name}`}</H>
        </View>
        <ChevronRight size={20} strokeWidth={ICON_STROKE} color={colors.text} />
      </View>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.neutral100, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', borderRadius: 999, backgroundColor: colors.accent2_600 }} />
      </View>
      {missing.length > 0 && <Txt size={13} color={colors.neutral800} numberOfLines={1}>Il manque : {missing.join(', ')}…</Txt>}
    </Pressable>
  );
}
