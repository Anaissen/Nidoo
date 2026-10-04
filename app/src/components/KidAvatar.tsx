import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ageLabel, Kid } from '../lib/kids';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';
import { H, Txt } from './ui';

/** Round avatar: the passport emoji, or the first letter. */
export function KidAvatar({ kid, size = 44 }: { kid: Pick<Kid, 'emoji' | 'name' | 'color'>; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: kid.color, alignItems: 'center', justifyContent: 'center' }}>
      {kid.emoji
        ? <Txt size={Math.round(size * 0.5)} lh={1.15}>{kid.emoji}</Txt>
        : <H size={Math.round(size * 0.41)} lh={1} color={colors.ink}>{kid.name.slice(0, 1).toUpperCase()}</H>}
    </View>
  );
}

/** Passport rows (tap to open) plus an "add a child" row. */
export function KidList() {
  const kids = useStore((s) => s.kids);
  return (
    <View style={{ gap: 10 }}>
      {kids.map((k) => (
        <Pressable key={k.id} onPress={() => router.push(`/passport/${k.id}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 26, backgroundColor: pressed ? colors.neutral200 : colors.neutral100 })}>
          <KidAvatar kid={k} size={52} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold">{k.name}</Txt>
            <Txt size={13} color={colors.neutral700}>{ageLabel(k)} · porte du {k.size}</Txt>
          </View>
          <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.text} />
        </Pressable>
      ))}
      <Pressable onPress={() => router.push('/passport/edit')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.neutral400, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} strokeWidth={ICON_STROKE} color={colors.neutral700} />
        </View>
        <Txt weight="semi">Ajouter un enfant</Txt>
      </Pressable>
    </View>
  );
}
