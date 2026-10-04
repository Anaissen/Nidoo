import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { H, LinkButton, PrimaryButton, Stripes, Txt } from '../components/ui';
import { AGES } from '../data/catalog';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

const SLIDES: { title: string; text: string; label: string; tones: [string, string] }[] = [
  { title: 'Bienvenue sur Nidoo', text: 'Le vide-dressing des 0-10 ans, entre parents. Achète malin, revends ce qui ne sert plus.', label: 'illustration · bienvenue', tones: ['#ffe1d0', '#fff2eb'] },
  { title: 'Une pièce ou tout un lot', text: "Vends ce qui ne lui va plus à l'unité, ou d'un coup en lot par taille, à prix fixe.", label: 'illustration · pièce vs lot', tones: ['#e1eecc', '#f0fae1'] },
  { title: 'Simple et protégé', text: 'Paiement sécurisé, versé au vendeur après réception. Point relais, domicile ou main propre.', label: 'illustration · colis', tones: ['#eee7db', '#f9f4ed'] },
];

/** `?kids=1` opens straight on the "ages" step, from the profile or the 1c "+" button. */
export default function Onboarding() {
  const { kids } = useLocalSearchParams<{ kids?: string }>();
  const fromProfile = kids === '1';
  const [step, setStep] = useState(fromProfile ? 3 : 0);
  const kidAges = useStore((s) => s.kidAges);
  const toggleKidAge = useStore((s) => s.toggleKidAge);
  const set = useStore((s) => s.set);
  const insets = useSafeAreaInsets();

  const finish = () => {
    if (fromProfile) { router.back(); return; }
    set({ onboarded: true });
    router.replace('/home');
  };

  const slide = SLIDES[Math.min(step, 2)];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 }}>
        <H size={22} color={colors.accent}>nidoo</H>
        {step < 3 && !fromProfile && <LinkButton label="Passer" color={colors.neutral700} onPress={() => setStep(3)} style={{ padding: 8 }} />}
      </View>

      {step < 3 ? (
        <>
          <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
            <View style={{ width: 260, height: 260 }}>
              <Stripes tones={slide.tones} style={{ width: 260, height: 260, borderRadius: 130, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={10} color={colors.neutral700} style={{ letterSpacing: 0.5 }}>{slide.label}</Txt>
              </Stripes>
              <View style={{ position: 'absolute', right: -18, bottom: 24, width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent2_300 }} />
            </View>
            <View style={{ gap: 10 }}>
              <H size={36}>{slide.title}</H>
              <Txt size={16} color={colors.neutral800}>{slide.text}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ height: 8, width: i === step ? 28 : 8, borderRadius: 999, backgroundColor: i === step ? colors.accent : colors.neutral400 }} />
              ))}
            </View>
            <PrimaryButton label="Suivant" height={56} onPress={() => setStep(step + 1)} style={{ paddingHorizontal: 28 }} />
          </View>
        </>
      ) : (
        <>
          <View style={{ flex: 1, gap: 22, paddingTop: 24 }}>
            <View style={{ gap: 8 }}>
              <H size={34}>Pour qui tu cherches ?</H>
              <Txt color={colors.neutral800}>Choisis les âges de tes enfants. On te montrera d'abord les bonnes tailles.</Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {AGES.map((a) => {
                const on = kidAges.includes(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => toggleKidAge(a)}
                    style={{
                      width: '48.5%', height: 64, borderRadius: 22, borderWidth: 2, borderColor: on ? colors.accent : 'transparent',
                      backgroundColor: on ? colors.accent100 : colors.neutral100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
                    }}
                  >
                    <Txt weight="semi">{a}</Txt>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? colors.accent : colors.neutral300, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} strokeWidth={3.5} color={colors.bg} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Txt size={13} color={colors.neutral700}>Tu pourras modifier ça à tout moment depuis ton profil.</Txt>
          </View>
          <PrimaryButton label={fromProfile ? 'Enregistrer' : "C'est parti"} height={56} onPress={finish} />
        </>
      )}
    </View>
  );
}
