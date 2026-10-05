import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPanel } from '../components/AuthPanel';
import { ParcelArt, PieceOrLotArt, SproutDot } from '../components/Illustrations';
import { KidList } from '../components/KidAvatar';
import { FullLogo, Logo } from '../components/Logo';
import { GIFT } from '../components/home/Home1c';
import { H, LinkButton, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { useStore } from '../store/useStore';
import { colors, shadows } from '../theme/tokens';

const SLIDES: { title: string; text: string }[] = [
  { title: 'Bienvenue sur Pimou', text: 'Pimou simplifie le quotidien des parents et de tous ceux qui achètent pour les enfants. Un lieu pensé pour gagner du temps, tout trouver au même endroit et éviter des heures de recherche, d\'achats et de colis à gérer.'},
  { title: 'Une pièce ou tout un lot', text: "Vends ce qui ne lui va plus à l'unité, ou d'un coup en lot par taille."},
  { title: 'Simple et protégé', text: 'Paiement sécurisé, versé au vendeur après réception. Point relais, domicile ou main propre.'},
];

/** Three intro slides, sign-up (or log in), then the children's passports. */
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const set = useStore((s) => s.set);
  const signedIn = useStore((s) => s.signedIn);
  // Already logged in (e.g. "Revoir l'onboarding"): skip the sign-up page.
  const afterSlides = signedIn ? 4 : 3;
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
        {step < 3 && <LinkButton label="Passer" color={colors.neutral700} onPress={() => setStep(afterSlides)} style={{ padding: 8 }} />}
      </View>

      {step < 3 ? (
        <>
          <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
            <View style={{ width: 260, height: 260 }}>
              {step === 0 ? (
                // Welcome page: the Pimou logo, big, on a soft round badge.
                // Stays light in dark mode too: the logo is drawn for a white background.
                <View style={{ width: 260, height: 260, borderRadius: 130, backgroundColor: '#fffaf3', alignItems: 'center', justifyContent: 'center', boxShadow: shadows.md }}>
                  <FullLogo width={196} />
                </View>
              ) : (
                <View style={{ borderRadius: 130, boxShadow: shadows.md }}>{step === 1 ? <PieceOrLotArt /> : <ParcelArt />}</View>
              )}
              {step > 0 && <View style={{ position: 'absolute', right: -18, bottom: 24 }}><SproutDot /></View>}
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
            <PrimaryButton label="Suivant" height={56} onPress={() => setStep(step === 2 ? afterSlides : step + 1)} style={{ paddingHorizontal: 28 }} />
          </View>
        </>
      ) : step === 3 ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <AuthPanel onDone={() => setStep(4)} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 22, paddingTop: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              <H size={34}>Présente-nous tes enfants</H>
              <Txt color={colors.neutral800}>Un petit passeport par enfant : prénom, âge, taille, couleurs préférées. On te montrera d'abord ce qui lui va.</Txt>
            </View>
            <KidList />
            <Txt size={13} color={colors.neutral700}>Tu pourras compléter les passeports à tout moment depuis ton profil. Pas d'enfant ? Pimou marche aussi très bien pour offrir.</Txt>
          </ScrollView>
          <View style={{ gap: 12 }}>
            <PrimaryButton label="C'est parti" height={56} onPress={finish} />
            <OutlineButton
              label="Pas d'enfant ? J'achète pour offrir"
              height={50}
              size={15}
              onPress={() => { set({ kids: [], activeKidId: GIFT }); finish(); }}
            />
          </View>
        </>
      )}
    </View>
  );
}
