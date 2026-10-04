import { router, useLocalSearchParams } from 'expo-router';
import { Layers, Shirt, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { OptionCard } from '../components/OptionCard';
import { BottomBar, Screen } from '../components/Screen';
import { Chip, CircleButton, H, LinkButton, monoFont, OutlineButton, PrimaryButton, Stripes, Txt } from '../components/ui';
import { AGES, CONDS, DeliveryId, GENDERS, ListingType, SEASONS, SELL_DELIVERY } from '../data/catalog';
import { fmt } from '../lib/format';
import { commissionRate, useStore } from '../store/useStore';
import { colors, fonts, ICON_STROKE } from '../theme/tokens';

type Draft = {
  step: number; type: ListingType | null; photos: number; title: string; age: string | null; gender: string;
  season: string | null; brand: string; cond: string | null; count: number; contents: string; price: string; negotiable: boolean; washed: boolean;
  d: Record<DeliveryId, boolean>;
};

const blank = (type: ListingType | null): Draft => ({
  step: type ? 1 : 0, type, photos: 0, title: '', age: null, gender: 'Mixte', season: null, brand: '', cond: null,
  count: 5, contents: '', price: '', negotiable: true, washed: true, d: { relais: true, domicile: false, main: true },
});

const ERRORS = ["Choisis un type d'annonce", 'Ajoute au moins une photo', "Ajoute un titre, un âge et l'état", 'Indique un prix et un mode de livraison'];

/** Publier une annonce — 4 étapes : type, photos, description, prix. `?type=lot` skips step 1. */
export default function Sell() {
  const { type, age } = useLocalSearchParams<{ type?: ListingType; age?: string }>();
  const [d, setD] = useState<Draft>(() => ({
    ...blank(type === 'lot' || type === 'unique' ? type : null),
    // Coming from a passport ("ne rentre plus dans le…"): pre-fill the size.
    age: age && (AGES as readonly string[]).includes(age) ? age : null,
  }));
  const commission = useStore((s) => s.commission);
  const publish = useStore((s) => s.publish);
  const showToast = useStore((s) => s.showToast);
  const scroll = useRef<ScrollView>(null);

  const patch = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const isLot = d.type === 'lot';
  const price = parseFloat(d.price.replace(',', '.')) || 0;
  const rate = commissionRate(commission);
  const canNext = [!!d.type, d.photos > 0, !!d.title.trim() && !!d.age && !!d.cond, price > 0 && Object.values(d.d).some(Boolean)][d.step];

  const goStep = (step: number) => { patch({ step }); scroll.current?.scrollTo({ y: 0, animated: false }); };

  const next = () => {
    if (!canNext) { showToast(ERRORS[d.step]); return; }
    if (d.step < 3) { goStep(d.step + 1); return; }
    const id = publish({
      type: d.type!, title: d.title.trim(), brand: d.brand.trim() || 'Sans marque', age: d.age!, size: d.age!, gender: d.gender,
      season: d.season || 'Toutes saisons', condition: d.cond!, price, color: isLot ? 'Multicolore' : 'Beige', sid: 'me', ph: 'ta photo',
      negotiable: d.negotiable, washed: d.washed, count: isLot ? d.count : undefined, contents: isLot ? [{ n: d.contents.trim() || 'Pièces assorties', q: d.count }] : undefined,
    });
    router.replace(`/sell-done?id=${id}`);
  };

  const chips = (key: 'age' | 'gender' | 'season' | 'cond', list: readonly string[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {list.map((o) => <Chip key={o} label={o} on={d[key] === o} onPress={() => patch({ [key]: o })} />)}
    </View>
  );

  const bottom = (
    <BottomBar>
      {d.step > 0 && <OutlineButton label="Retour" size={16} onPress={() => goStep(d.step - 1)} />}
      <PrimaryButton label={d.step === 3 ? "Publier l'annonce" : 'Continuer'} onPress={next} disabledLook={!canNext} style={{ flex: 1 }} />
    </BottomBar>
  );

  return (
    <Screen ref={scroll} bottom={bottom} keyboard contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 20, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleButton onPress={() => router.back()} accessibilityLabel="Fermer">
            <X size={20} strokeWidth={ICON_STROKE} color={colors.text} />
          </CircleButton>
          <View style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${((d.step + 1) / 4) * 100}%`, backgroundColor: colors.accent, borderRadius: 999 }} />
          </View>
          <Txt size={13} weight="semi" color={colors.neutral700}>{d.step + 1}/4</Txt>
        </View>

        {d.step === 0 && (
          <>
            <H size={30}>Qu'est-ce que tu vends ?</H>
            {([
              ['unique', 'Une pièce unique', 'Un vêtement, une annonce. Idéal pour les belles pièces.'],
              ['lot', 'Un lot', "Plusieurs vêtements d'une même taille, vendus ensemble à prix fixe."],
            ] as const).map(([v, t, x]) => {
              const on = d.type === v;
              const Icon = v === 'lot' ? Layers : Shirt;
              return (
                <Pressable key={v} onPress={() => patch({ type: v })} style={{ borderWidth: 2, borderColor: on ? colors.accent : 'transparent', backgroundColor: on ? colors.accent100 : colors.neutral100, borderRadius: 32, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: v === 'lot' ? colors.accent2_300 : colors.accent300, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={28} strokeWidth={ICON_STROKE} color={colors.text} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <H size={20}>{t}</H>
                    <Txt size={14} color={colors.neutral800}>{x}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        {d.step === 1 && (
          <>
            <View style={{ gap: 6 }}>
              <H size={30}>Ajoute des photos</H>
              <Txt size={14} color={colors.neutral800}>
                {isLot ? "Commence par une photo de tout le lot étalé, puis une par pièce. Jusqu'à 12 photos." : "De face, de dos et l'étiquette. Jusqu'à 6 photos."}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const filled = i < d.photos;
                const isNext = i === d.photos;
                const label = filled ? (i === 0 ? 'couverture' : `photo ${i + 1}`) : isNext ? '+ ajouter' : '';
                const box = { width: '31.5%' as const, aspectRatio: 1, borderRadius: 24 };
                // Demo: tapping adds a photo slot; tapping a filled one trims back to it. Wire expo-image-picker here.
                const onPress = () => patch({ photos: filled ? i : Math.min(6, d.photos + 1) });
                return filled ? (
                  <Pressable key={i} onPress={onPress} style={box}>
                    <Stripes tones={['#ffe1d0', '#fff2eb']} style={[StyleSheet.absoluteFill, { borderRadius: 24, alignItems: 'center', justifyContent: 'center' }]}>
                      <Txt size={9} color={colors.neutral700} style={{ fontFamily: monoFont }}>{label}</Txt>
                    </Stripes>
                  </Pressable>
                ) : (
                  <Pressable key={i} onPress={onPress} style={[box, { borderWidth: 2, borderStyle: 'dashed', borderColor: isNext ? colors.accent : colors.neutral300, backgroundColor: colors.neutral100, alignItems: 'center', justifyContent: 'center' }]}>
                    <Txt size={9} color={colors.neutral700} style={{ fontFamily: monoFont }}>{label}</Txt>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <Txt size={13} color={colors.accent2_800}>Lumière du jour, fond uni, vêtement à plat : tes photos se vendent mieux.</Txt>
            </View>
          </>
        )}

        {d.step === 2 && (
          <>
            <H size={30}>Décris {isLot ? 'ton lot' : 'ta pièce'}</H>
            <Field label="Titre">
              <TextInput value={d.title} onChangeText={(t) => patch({ title: t })} placeholder={isLot ? 'ex. Lot hiver 18 mois garçon' : 'ex. Robe en lin rose'} placeholderTextColor={colors.neutral600} style={input()} />
            </Field>
            {isLot && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingRight: 12, paddingLeft: 18, borderRadius: 999, backgroundColor: colors.surface }}>
                  <Txt weight="semi">Nombre de pièces</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Stepper label="−" onPress={() => patch({ count: Math.max(2, d.count - 1) })} />
                    <H size={22} style={{ minWidth: 24, textAlign: 'center' }}>{d.count}</H>
                    <Stepper label="+" onPress={() => patch({ count: Math.min(40, d.count + 1) })} />
                  </View>
                </View>
                <Field label="Contenu du lot">
                  <TextInput value={d.contents} onChangeText={(t) => patch({ contents: t })} multiline placeholder="ex. 3 bodies, 2 pyjamas, 1 gilet…" placeholderTextColor={colors.neutral600} style={[input(), { minHeight: 80, height: undefined, borderRadius: 24, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' }]} />
                </Field>
              </>
            )}
            <Field label="Âge / taille">{chips('age', AGES)}</Field>
            <Field label="Pour">{chips('gender', GENDERS)}</Field>
            <Field label="Saison">{chips('season', SEASONS)}</Field>
            <Field label="État">
              {chips('cond', CONDS)}
              <LinkButton label="Un doute ? Voir le guide des états →" size={13} onPress={() => router.push(`/conditions${d.cond ? `?focus=${encodeURIComponent(d.cond)}` : ''}`)} />
            </Field>
            <Field label="Marque (facultatif)">
              <TextInput value={d.brand} onChangeText={(t) => patch({ brand: t })} placeholder="ex. Petit Bateau" placeholderTextColor={colors.neutral600} style={input()} />
            </Field>
          </>
        )}

        {d.step === 3 && (
          <>
            <H size={30}>Ton prix</H>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 84, paddingHorizontal: 24, borderRadius: 32, backgroundColor: colors.neutral100, borderWidth: 2, borderColor: colors.accent }}>
              <TextInput
                value={d.price}
                onChangeText={(t) => patch({ price: t.replace(/[^0-9.,]/g, '') })}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.neutral500}
                style={{ flex: 1, minWidth: 0, fontFamily: fonts.heading, fontSize: 40, color: colors.text, paddingVertical: 0, outlineWidth: 0 }}
              />
              <H size={32}>€</H>
            </View>
            <View style={{ gap: 8, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
              <Line l="Prix affiché" r={fmt(price)} />
              <Line l={`Commission Pimoo (${commission} %)`} r={`− ${fmt(price * rate)}`} muted />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
                <Txt size={16} weight="bold">Tu recevras</Txt>
                <Txt size={16} weight="bold" color={colors.accent2_700}>{fmt(price * (1 - rate))}</Txt>
              </View>
              {isLot && <Txt size={13} color={colors.neutral700}>Soit {fmt(d.count ? price / d.count : 0)} la pièce pour l'acheteur.</Txt>}
            </View>
            <OptionCard
              control="check"
              on={d.washed}
              title="Lavé et plié"
              sub="Tu t'engages à envoyer des vêtements propres. Les acheteurs le confirment à la réception."
              onPress={() => patch({ washed: !d.washed })}
            />
            <OptionCard
              control="check"
              on={d.negotiable}
              title="J'accepte les offres"
              sub="Les acheteurs peuvent te proposer un prix, tu restes libre de dire non."
              onPress={() => patch({ negotiable: !d.negotiable })}
            />
            <Field label="Modes de livraison acceptés">
              <View style={{ gap: 8 }}>
                {SELL_DELIVERY.map((o) => (
                  <OptionCard key={o.id} control="check" on={d.d[o.id]} title={o.title} sub={o.sub} onPress={() => patch({ d: { ...d.d, [o.id]: !d.d[o.id] } })} />
                ))}
              </View>
            </Field>
          </>
        )}
      </View>
    </Screen>
  );
}

const input = () => ({
  height: 50, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100,
  paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0,
} as const);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ gap: 8 }}>
    <Txt size={13} weight="semi">{label}</Txt>
    {children}
  </View>
);

const Stepper = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <CircleButton size={40} bg={colors.neutral100} onPress={onPress}>
    <Txt size={20} lh={1}>{label}</Txt>
  </CircleButton>
);

const Line = ({ l, r, muted }: { l: string; r: string; muted?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{l}</Txt>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{r}</Txt>
  </View>
);
