import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';

import { ColorDot } from '../../components/FilterSheet';
import { KidAvatar } from '../../components/KidAvatar';
import { BottomBar, Screen, BackButton } from '../../components/Screen';
import { Chip, H, LinkButton, PrimaryButton, Txt } from '../../components/ui';
import { AGES, COLORS } from '../../data/catalog';
import { ageLabel, ageInMonths, bucketForMonths, daysInMonth, Kid, KID_COLORS, KID_EMOJIS, KID_STYLES, MONTHS } from '../../lib/kids';
import { useStore } from '../../store/useStore';
import { colors, fonts } from '../../theme/tokens';

const now = new Date();
const YEARS = Array.from({ length: 11 }, (_, i) => now.getFullYear() - i);

const blankKid = (): Kid => ({
  id: 'k' + Date.now(), name: '', emoji: '', color: KID_COLORS[0], birthYear: now.getFullYear() - 2, birthMonth: now.getMonth() + 1, birthDay: now.getDate(),
  gender: 'Mixte', size: bucketForMonths(24), favColors: [], styles: [], notes: '', showNextSize: false,
});

/** Create (no `id`) or edit a child's passport. */
export default function PassportEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.kids.find((k) => k.id === id));
  const saveKid = useStore((s) => s.saveKid);
  const removeKid = useStore((s) => s.removeKid);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const [k, setK] = useState<Kid>(() => existing ?? blankKid());
  // Until the parent picks a size, follow the one matching the birth date.
  const [sizeTouched, setSizeTouched] = useState(!!existing?.sizeManual);
  const patch = (p: Partial<Kid>) => setK((x) => {
    const next = { ...x, ...p };
    if (!sizeTouched && (p.birthYear || p.birthMonth || p.birthDay)) next.size = bucketForMonths(ageInMonths(next));
    return next;
  });
  const toggle = (key: 'favColors' | 'styles', v: string) => patch({ [key]: k[key].includes(v) ? k[key].filter((x) => x !== v) : [...k[key], v] });
  const num = (t: string) => { const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) ? n : undefined; };
  const birth = new Date(k.birthYear, k.birthMonth - 1, k.birthDay ?? 1);
  const future = birth > now;
  const maxDay = daysInMonth(k.birthYear, k.birthMonth);

  const save = () => {
    if (!k.name.trim()) { showToast('Ajoute son prénom'); return; }
    if (future) { showToast('La date de naissance est dans le futur'); return; }
    saveKid({ ...k, name: k.name.trim() });
    set({ activeKidId: k.id });
    router.back();
  };

  const remove = () => {
    const go = () => { removeKid(k.id); router.dismissTo('/kids'); };
    if (Platform.OS === 'web') { go(); return; }
    Alert.alert(`Supprimer le passeport de ${k.name} ?`, '', [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: go }]);
  };

  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }} bottom={<BottomBar><PrimaryButton label="Enregistrer le passeport" onPress={save} style={{ flex: 1 }} /></BottomBar>}>
      <View style={{ gap: 22, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <H size={26} style={{ flex: 1 }}>{existing ? 'Modifier le passeport' : 'Nouveau passeport'}</H>
        </View>

        <View style={{ alignItems: 'center', gap: 10 }}>
          <KidAvatar kid={{ ...k, name: k.name || '?' }} size={96} />
          <Txt size={13} color={colors.neutral700}>{k.name ? `${k.name} · ${ageLabel(k)}` : 'Choisis son avatar'}</Txt>
        </View>

        <Field label="Prénom">
          <TextInput value={k.name} onChangeText={(t) => patch({ name: t })} placeholder="ex. Léa" placeholderTextColor={colors.neutral600} style={input()} autoCapitalize="words" />
        </Field>

        <Field label="Son avatar">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {KID_EMOJIS.map((e) => (
              <Pressable key={e || 'letter'} onPress={() => patch({ emoji: e })} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral100, borderWidth: 2, borderColor: k.emoji === e ? colors.accent : 'transparent' }}>
                {e ? <Txt size={22} lh={1.15}>{e}</Txt> : <H size={18}>{(k.name || 'A').slice(0, 1).toUpperCase()}</H>}
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {KID_COLORS.map((c) => (
              <Pressable key={c} onPress={() => patch({ color: c })} accessibilityLabel="Couleur" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: 3, borderColor: k.color === c ? colors.text : 'transparent' }} />
            ))}
          </View>
        </Field>

        <Field label="Date de naissance">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {YEARS.map((y) => <Chip key={y} label={String(y)} on={k.birthYear === y} onPress={() => patch({ birthYear: y, birthDay: Math.min(k.birthDay ?? 1, daysInMonth(y, k.birthMonth)) })} />)}
          </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MONTHS.map((m, i) => <Chip key={m} label={m} on={k.birthMonth === i + 1} onPress={() => patch({ birthMonth: i + 1, birthDay: Math.min(k.birthDay ?? 1, daysInMonth(k.birthYear, i + 1)) })} height={34} />)}
          </View>
          <Txt size={12} color={colors.neutral700}>Jour</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => {
              const on = k.birthDay === d;
              return (
                <Pressable key={d} onPress={() => patch({ birthDay: d })} accessibilityLabel={`Jour ${d}`} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.text : colors.neutral100 }}>
                  <Txt size={14} weight="semi" color={on ? colors.bg : colors.text}>{d}</Txt>
                </Pressable>
              );
            })}
          </View>
          {future && <Txt size={13} color={colors.accent700}>Cette date est dans le futur.</Txt>}
        </Field>

        <Field label="C'est">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['Fille', 'Une fille'], ['Garçon', 'Un garçon'], ['Mixte', 'Je préfère tout voir']] as const).map(([v, l]) => (
              <Chip key={v} label={l} on={k.gender === v} onPress={() => patch({ gender: v })} />
            ))}
          </View>
        </Field>

        <Field label="Taille portée" hint={sizeTouched ? "Choisie à la main : elle ne suivra plus l'âge automatiquement." : "Calculée d'après son âge, et mise à jour quand l'enfant grandit. Change-la s'il ou elle porte plus grand ou plus petit."}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AGES.map((a) => <Chip key={a} label={a} on={k.size === a} onPress={() => { setSizeTouched(true); patch({ size: a, sizeManual: true }); }} />)}
          </View>
          {sizeTouched && (
            <LinkButton label="Revenir à la taille selon son âge" size={13} onPress={() => { setSizeTouched(false); setK((x) => ({ ...x, sizeManual: false, size: bucketForMonths(ageInMonths(x)) })); }} />
          )}
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Taille (cm)">
              <TextInput value={k.heightCm ? String(k.heightCm) : ''} onChangeText={(t) => patch({ heightCm: num(t) })} keyboardType="decimal-pad" placeholder="ex. 94" placeholderTextColor={colors.neutral600} style={input()} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Pointure">
              <TextInput value={k.shoeSize ? String(k.shoeSize) : ''} onChangeText={(t) => patch({ shoeSize: num(t) })} keyboardType="decimal-pad" placeholder="ex. 25" placeholderTextColor={colors.neutral600} style={input()} />
            </Field>
          </View>
        </View>

        <Field label="Ses couleurs préférées">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(COLORS).map((c) => <Chip key={c} label={c} on={k.favColors.includes(c)} onPress={() => toggle('favColors', c)} left={<ColorDot name={c} />} />)}
          </View>
        </Field>

        <Field label="Son style">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {KID_STYLES.map((st) => <Chip key={st} label={st} on={k.styles.includes(st)} onPress={() => toggle('styles', st)} />)}
          </View>
        </Field>

        <Field label="Petits mots" hint="Ce qu'il faut savoir : matières à éviter, coupes qu'il ou elle adore…">
          <TextInput
            value={k.notes} onChangeText={(t) => patch({ notes: t })} multiline placeholder="ex. Adore les poches, pas de laine qui gratte" placeholderTextColor={colors.neutral600}
            style={[input(), { height: undefined, minHeight: 90, borderRadius: 24, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' }]}
          />
        </Field>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.neutral100 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="semi">Voir aussi la taille au-dessus</Txt>
            <Txt size={13} color={colors.neutral700}>Pratique quand ça grandit vite.</Txt>
          </View>
          <Switch value={k.showNextSize} onValueChange={(v) => patch({ showNextSize: v })} trackColor={{ true: colors.accent, false: colors.neutral300 }} thumbColor={colors.neutral100} />
        </View>

        {existing && <LinkButton label="Supprimer ce passeport" color={colors.accent700} onPress={remove} style={{ alignSelf: 'center', paddingVertical: 8 }} />}
      </View>
    </Screen>
  );
}

const input = () => ({
  height: 50, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100,
  paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0,
} as const);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <View style={{ gap: 10 }}>
    <View style={{ gap: 2 }}>
      <Txt size={13} weight="semi">{label}</Txt>
      {hint && <Txt size={12} color={colors.neutral700}>{hint}</Txt>}
    </View>
    {children}
  </View>
);
