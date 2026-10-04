import { router, useLocalSearchParams } from 'expo-router';
import { Check, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { KidAvatar } from '../../components/KidAvatar';
import { BackButton, Screen } from '../../components/Screen';
import { CircleButton, H, PrimaryButton, Segmented, Txt } from '../../components/ui';
import { WARDROBE_TEMPLATES } from '../../data/catalog';
import { newWardrobe, useStore, Wardrobe } from '../../store/useStore';
import { colors, fonts, ICON_STROKE } from '../../theme/tokens';

/** Garde-robe de saison: what this child needs, ticked by hand or by purchases. */
export default function WardrobeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const kid = useStore((s) => s.kids.find((k) => k.id === id));
  const w = useStore((s) => s.wardrobes[id]) ?? newWardrobe();
  const setGot = useStore((s) => s.setWardrobeGot);
  const addLine = useStore((s) => s.addWardrobeLine);
  const removeLine = useStore((s) => s.removeWardrobeLine);
  const reset = useStore((s) => s.resetWardrobe);
  const searchWith = useStore((s) => s.searchWith);
  const set = useStore((s) => s.set);
  const [draft, setDraft] = useState('');
  if (!kid) return <Screen><Txt style={{ padding: 20 }}>Enfant introuvable.</Txt></Screen>;

  const need = w.lines.reduce((a, l) => a + l.need, 0);
  const got = w.lines.reduce((a, l) => a + l.got, 0);

  const find = (kw: string) => {
    searchWith({ f: { ages: [kid.size] } });
    set({ q: kw, activeKidId: kid.id });
    router.navigate('/search');
  };
  const changeSeason = (season: Wardrobe['season']) => { if (season !== w.season) reset(kid.id, season); };

  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackButton />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <KidAvatar kid={kid} size={56} />
          <View style={{ flex: 1 }}>
            <Txt size={11} weight="bold" color={colors.accent700} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>Garde-robe · {kid.size}</Txt>
            <H size={28} lh={1.1}>Pour {kid.name}</H>
          </View>
        </View>

        <Segmented options={[['hiver', 'Automne-hiver'], ['ete', 'Printemps-été']]} value={w.season} onChange={changeSeason} />

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <H size={20}>{got === need ? 'Tout est prêt ✓' : `${got} sur ${need} pièces`}</H>
            <Txt size={13} color={colors.neutral700}>{need ? Math.round((got / need) * 100) : 0} %</Txt>
          </View>
          <View style={{ height: 12, borderRadius: 999, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <View style={{ width: `${need ? (got / need) * 100 : 0}%`, height: '100%', borderRadius: 999, backgroundColor: colors.accent2_600 }} />
          </View>
          <Txt size={13} color={colors.neutral700}>Tes achats sur Pimou cochent automatiquement la garde-robe de l'enfant sélectionné sur l'accueil.</Txt>
        </View>

        <View style={{ gap: 10 }}>
          {w.lines.map((l) => {
            const done = l.got >= l.need;
            return (
              <View key={l.id} style={{ padding: 14, borderRadius: 24, backgroundColor: done ? colors.accent2_100 : colors.neutral100, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => setGot(kid.id, l.id, done ? 0 : l.need)}
                    accessibilityLabel={done ? 'Décocher' : 'Cocher'}
                    style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: done ? colors.accent2_600 : colors.neutral400, backgroundColor: done ? colors.accent2_600 : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {done && <Check size={16} strokeWidth={3.5} color={colors.bg} />}
                  </Pressable>
                  <Txt weight="semi" style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }} color={done ? colors.accent2_800 : colors.text}>{l.label}</Txt>
                  <Pressable onPress={() => removeLine(kid.id, l.id)} hitSlop={8} accessibilityLabel="Retirer">
                    <X size={16} strokeWidth={ICON_STROKE} color={colors.neutral600} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 42 }}>
                  <CircleButton size={34} bg={colors.bg} onPress={() => setGot(kid.id, l.id, l.got - 1)}><Txt size={18} lh={1}>−</Txt></CircleButton>
                  <Txt weight="bold" style={{ minWidth: 44, textAlign: 'center' }}>{l.got} / {l.need}</Txt>
                  <CircleButton size={34} bg={colors.bg} onPress={() => setGot(kid.id, l.id, l.got + 1)}><Txt size={18} lh={1}>+</Txt></CircleButton>
                  {!done && (
                    <Pressable onPress={() => find(l.kw)} style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.text }}>
                      <Search size={14} strokeWidth={ICON_STROKE} color={colors.bg} />
                      <Txt size={13} weight="semi" color={colors.bg}>Trouver</Txt>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ajouter (ex. Maillot de bain)"
            placeholderTextColor={colors.neutral600}
            onSubmitEditing={() => { addLine(kid.id, draft); setDraft(''); }}
            style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0 }}
          />
          <PrimaryButton label="Ajouter" height={48} size={15} onPress={() => { addLine(kid.id, draft); setDraft(''); }} />
        </View>
        <Txt size={12} color={colors.neutral600}>Liste de départ « {WARDROBE_TEMPLATES[w.season].title} ». Change de saison pour repartir d'une nouvelle liste.</Txt>
      </View>
    </Screen>
  );
}
