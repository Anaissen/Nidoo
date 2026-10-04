import { router } from 'expo-router';
import { View } from 'react-native';

import { OptionCard } from '../components/OptionCard';
import { BackHeader, Screen } from '../components/Screen';
import { CircleButton, H, OutlineButton, Txt } from '../components/ui';
import { HomeVariant, useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

const VARIANTS: { id: HomeVariant; title: string; sub: string }[] = [
  { id: '1a', title: '1a · Classique', sub: 'Recherche, âges, lots du moment, nouveautés' },
  { id: '1b', title: '1b · Éditorial', sub: 'Entrée par âge en formes rondes, lot de la semaine' },
  { id: '1c', title: '1c · Par enfant', sub: 'Profils Léa / Tom, flux à la bonne taille' },
];

/** The design's "Tweaks": home direction and seller commission, persisted on the device. */
export default function Settings() {
  const homeVariant = useStore((s) => s.homeVariant);
  const commission = useStore((s) => s.commission);
  const set = useStore((s) => s.set);

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Réglages" />

        <View style={{ gap: 8 }}>
          <H size={18}>Page d'accueil</H>
          {VARIANTS.map((v) => (
            <OptionCard key={v.id} control="radio" on={homeVariant === v.id} title={v.title} sub={v.sub} onPress={() => set({ homeVariant: v.id })} />
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <H size={18}>Commission vendeur</H>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingRight: 12, paddingLeft: 18, borderRadius: 999, backgroundColor: colors.surface }}>
            <Txt weight="semi">Taux prélevé à la vente</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <CircleButton size={40} bg={colors.neutral100} onPress={() => set({ commission: Math.max(0, commission - 1) })}><Txt size={20} lh={1}>−</Txt></CircleButton>
              <H size={22} style={{ minWidth: 48, textAlign: 'center' }}>{commission} %</H>
              <CircleButton size={40} bg={colors.neutral100} onPress={() => set({ commission: Math.min(20, commission + 1) })}><Txt size={20} lh={1}>+</Txt></CircleButton>
            </View>
          </View>
        </View>

        <OutlineButton label="Revoir l'onboarding" onPress={() => { set({ onboarded: false }); router.dismissAll(); router.replace('/onboarding'); }} />
      </View>
    </Screen>
  );
}
