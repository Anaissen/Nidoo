import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ComponentType, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { KidDemo, LookDemo, LotDemo, OfferDemo, SafeDemo, SellDemo } from '../components/GuideDemos';
import { Logo } from '../components/Logo';
import { BottomBar, Screen } from '../components/Screen';
import { H, LinkButton, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { colors } from '../theme/tokens';

type Step = { kicker: string; title: string; text: string; tryIt?: string; Demo?: ComponentType<{ onDone: () => void }> };

const STEPS: Step[] = [
  { kicker: '1 · Ton accueil', title: 'Un flux pour chaque enfant', text: "Chaque enfant a son passeport. Pimou te montre d'abord les vêtements à sa taille, dans ses couleurs préférées.", tryIt: 'Touche Tom pour voir son flux.', Demo: KidDemo },
  { kicker: '2 · Acheter', title: 'Une pièce ou tout un lot', text: "Les lots regroupent plusieurs vêtements d'une même taille. Pratique et souvent moins cher à la pièce.", tryIt: 'Touche « Un lot » pour comparer.', Demo: LotDemo },
  { kicker: '3 · Négocier', title: 'Fais une offre', text: "C'est de la seconde main : propose ton prix. Le vendeur accepte ou te fait une contre-offre, directement dans la messagerie.", tryIt: 'Choisis un prix et regarde la réponse.', Demo: OfferDemo },
  { kicker: '4 · En confiance', title: 'Ton paiement est protégé', text: "Le vendeur n'est payé qu'une fois que tu as reçu ta commande et confirmé que tout va bien.", tryIt: 'Avance la commande étape par étape.', Demo: SafeDemo },
  { kicker: '5 · Vendre', title: 'Revends en 2 minutes', text: 'Touche le gros + en bas de l\'écran : photos, description, prix. Tu vois tout de suite ce que tu vas recevoir.', tryIt: 'Choisis un prix.', Demo: SellDemo },
  { kicker: '6 · À ta façon', title: 'Choisis ton affichage', text: 'Mode clair ou sombre, texte normal ou plus grand : Pimou s\'adapte à toi. Ces réglages se trouvent dans Profil → Réglages.', tryIt: 'Essaie le mode sombre et un texte plus grand.', Demo: LookDemo },
  { kicker: 'C\'est parti', title: 'Tu sais tout !', text: 'Tu pourras revoir ce guide à tout moment depuis ton profil, dans « Comment ça marche ».' },
];

/** Interactive "Comment ça marche" guide. `?first=1` after onboarding: ends on the home screen. */
export default function Guide() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const [i, setI] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));
  const scroll = useRef<ScrollView>(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const close = () => (first ? router.replace('/home') : router.back());
  const go = (n: number) => { setI(n); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const markDone = () => setDone((d) => d.map((x, n) => (n === i ? true : x)));

  const bottom = (
    <BottomBar>
      {i > 0 && <OutlineButton label="Retour" size={16} onPress={() => go(i - 1)} />}
      <PrimaryButton label={last ? (first ? 'Découvrir Pimou' : 'Terminer') : 'Suivant'} onPress={() => (last ? close() : go(i + 1))} style={{ flex: 1 }} />
    </BottomBar>
  );

  return (
    <Screen ref={scroll} bottom={bottom} contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 20, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <Logo size={22} />
          {!last && <LinkButton label="Passer" color={colors.neutral700} onPress={close} style={{ padding: 8 }} />}
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map((_, n) => (
            <View key={n} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: n <= i ? colors.accent : colors.neutral300 }} />
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Txt size={12} weight="bold" color={colors.accent700} style={{ letterSpacing: 0.96, textTransform: 'uppercase' }}>{step.kicker}</Txt>
          <H size={32}>{step.title}</H>
          <Txt size={16} color={colors.neutral800}>{step.text}</Txt>
        </View>

        {step.Demo && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: done[i] ? colors.accent2_100 : colors.accent100 }}>
              {done[i] && <Check size={14} strokeWidth={3.5} color={colors.accent2_800} />}
              <Txt size={13} weight="semi" color={done[i] ? colors.accent2_800 : colors.accent800}>{done[i] ? 'Bravo, tu as compris !' : `À toi : ${step.tryIt}`}</Txt>
            </View>
            <step.Demo key={i} onDone={markDone} />
          </>
        )}

        {last && (
          <View style={{ gap: 10 }}>
            {['Ton accueil suit les passeports de tes enfants', 'Tu peux acheter à la pièce ou en lot', 'Les prix se négocient', 'Ton paiement est protégé', 'Vendre prend 2 minutes', 'Tu choisis l\'affichage et la taille du texte'].map((t) => (
              <View key={t} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent2_600, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={13} strokeWidth={3.5} color={colors.bg} />
                </View>
                <Txt>{t}</Txt>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
