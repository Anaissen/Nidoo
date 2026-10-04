import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KidList } from '../components/KidAvatar';
import { Logo } from '../components/Logo';
import { H, LinkButton, PrimaryButton, Stripes, Txt } from '../components/ui';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

const SLIDES: { title: string; text: string; label: string; tones: [string, string] }[] = [
  { title: 'Bienvenue sur Pimou', text: 'Le vide-dressing des 0-10 ans, entre parents. Achète malin, revends ce qui ne sert plus.', label: 'illustration · bienvenue', tones: ['#ffe1d0', '#fff2eb'] },
  { title: 'Une pièce ou tout un lot', text: "Vends ce qui ne lui va plus à l'unité, ou d'un coup en lot par taille, à prix fixe.", label: 'illustration · pièce vs lot', tones: ['#e1eecc', '#f0fae1'] },
  { title: 'Simple et protégé', text: 'Paiement sécurisé, versé au vendeur après réception. Point relais, domicile ou main propre.', label: 'illustration · colis', tones: ['#eee7db', '#f9f4ed'] },
];

/** Three intro slides, then the children's passports. */
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const set = useStore((s) => s.set);
  const insets = useSafeAreaInsets();

  const finish = () => {
    set({ onboarded: true });
    router.replace('/guide?first=1');
  };

  const slide = SLIDES[Math.min(step, 2)];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 }}>
        <Logo size={22} />
        {step < 3 && <LinkButton label="Passer" color={colors.neutral700} onPress={() => setStep(3)} style={{ padding: 8 }} />}
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 22, paddingTop: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              <H size={34}>Présente-nous tes enfants</H>
              <Txt color={colors.neutral800}>Un petit passeport par enfant : prénom, âge, taille, couleurs préférées. On te montrera d'abord ce qui lui va.</Txt>
            </View>
            <KidList />
            <Txt size={13} color={colors.neutral700}>Tu pourras compléter les passeports à tout moment depuis ton profil.</Txt>
          </ScrollView>
          <PrimaryButton label="C'est parti" height={56} onPress={finish} />
        </>
      )}
    </View>
  );
}
