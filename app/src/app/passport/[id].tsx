import { router, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { View } from 'react-native';

import { ColorDot } from '../../components/FilterSheet';
import { KidAvatar } from '../../components/KidAvatar';
import { GrowAlertCard, WardrobeCard } from '../../components/KidCards';
import { Sprig } from '../../components/Logo';
import { BackButton, Screen } from '../../components/Screen';
import { CircleButton, H, OutlineButton, PrimaryButton, Tag, Txt } from '../../components/ui';
import { ageLabel, birthdayNote, birthLabel, nextSize, prevSize } from '../../lib/kids';
import { useStore } from '../../store/useStore';
import { colors, ICON_STROKE, shadows } from '../../theme/tokens';

/** A child's passport, laid out like a little ID card. */
export default function Passport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const kid = useStore((s) => s.kids.find((k) => k.id === id));
  const set = useStore((s) => s.set);
  if (!kid) return <Screen><Txt style={{ padding: 20 }}>Passeport introuvable.</Txt></Screen>;

  const birthday = birthdayNote(kid);
  const prev = prevSize(kid.size);
  const rows: [string, string][] = [
    ['Naissance', birthLabel(kid)],
    ['Âge', ageLabel(kid)],
    ['Porte du', kid.size],
    ['Taille', kid.heightCm ? `${kid.heightCm} cm` : '—'],
    ['Pointure', kid.shoeSize ? String(kid.shoeSize) : '—'],
    ['Pour', kid.gender === 'Mixte' ? 'Tout voir' : kid.gender],
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <BackButton />
          <CircleButton onPress={() => router.push(`/passport/edit?id=${kid.id}`)} accessibilityLabel="Modifier">
            <Pencil size={18} strokeWidth={ICON_STROKE} color={colors.text} />
          </CircleButton>
        </View>

        <View style={{ borderRadius: 32, backgroundColor: colors.neutral100, overflow: 'hidden', boxShadow: shadows.md }}>
          <View style={{ backgroundColor: kid.color, paddingTop: 22, paddingBottom: 18, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ borderRadius: 48, borderWidth: 4, borderColor: colors.neutral100 }}>
              <KidAvatar kid={{ ...kid, color: colors.neutral100 }} size={80} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt size={11} weight="bold" color={colors.ink} style={{ letterSpacing: 1.1, textTransform: 'uppercase', opacity: 0.75 }}>Passeport Pimou</Txt>
                <Sprig size={14} />
              </View>
              <H size={34} lh={1.05} color={colors.ink}>{kid.name}</H>
            </View>
          </View>

          <View style={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
              {rows.map(([k, v]) => (
                <View key={k} style={{ width: '50%' }}>
                  <Txt size={11} color={colors.neutral700} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>{k}</Txt>
                  <Txt weight="semi">{v}</Txt>
                </View>
              ))}
            </View>

            {kid.favColors.length > 0 && (
              <View style={{ gap: 6 }}>
                <Txt size={11} color={colors.neutral700} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>Couleurs préférées</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {kid.favColors.map((c) => (
                    <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.bg }}>
                      <ColorDot name={c} /><Txt size={13} weight="semi">{c}</Txt>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {kid.styles.length > 0 && (
              <View style={{ gap: 6 }}>
                <Txt size={11} color={colors.neutral700} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>Son style</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {kid.styles.map((st) => <Tag key={st} label={st} bg={colors.accent2_100} fg={colors.accent2_800} size={13} weight="semi" />)}
                </View>
              </View>
            )}

            {!!kid.notes && (
              <View style={{ padding: 14, borderRadius: 20, backgroundColor: colors.accent100 }}>
                <Txt size={11} color={colors.accent800} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>Petits mots</Txt>
                <Txt size={14} color={colors.accent900}>« {kid.notes} »</Txt>
              </View>
            )}
          </View>
        </View>

        <GrowAlertCard kid={kid} inset={false} />
        <WardrobeCard kid={kid} inset={false} />

        {birthday && (
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
            <Txt weight="semi" color={colors.accent2_800}>{birthday}</Txt>
            <Txt size={13} color={colors.accent2_800}>C'est le moment de regarder le {nextSize(kid.size)}.</Txt>
          </View>
        )}

        <PrimaryButton label={`Voir les articles pour ${kid.name}`} onPress={() => { set({ activeKidId: kid.id }); router.dismissTo('/home'); }} />
        {prev && <OutlineButton label={`Revendre son ${prev} en lot`} onPress={() => router.push(`/sell?type=lot&age=${encodeURIComponent(prev)}`)} />}
      </View>
    </Screen>
  );
}
