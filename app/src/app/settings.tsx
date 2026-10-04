import { router } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { VerifiedBadge } from '../components/Badges';
import { BackHeader, Screen } from '../components/Screen';
import { CircleButton, H, OutlineButton, PrimaryButton, Segmented, Txt } from '../components/ui';
import { ThemeMode, useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

const SCALES: [string, string][] = [['1', 'Normal'], ['1.15', 'Grand'], ['1.3', 'Très grand']];

/** Affichage (mode sombre, taille du texte), vérification du compte et réglages de démo. */
export default function Settings() {
  const commission = useStore((s) => s.commission);
  const theme = useStore((s) => s.theme);
  const textScale = useStore((s) => s.textScale);
  const meVerified = useStore((s) => s.meVerified);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  // The whole app re-renders with the new look; `returnTo` brings us back here.
  const setLook = (patch: { theme?: ThemeMode; textScale?: number }) => set({ ...patch, returnTo: '/settings' });

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 22, paddingTop: 4 }}>
        <BackHeader title="Réglages" />

        <View style={{ gap: 10 }}>
          <H size={18}>Apparence</H>
          <Segmented options={[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']]} value={theme} onChange={(v) => setLook({ theme: v })} />
          <Txt size={13} color={colors.neutral700}>« Automatique » suit le réglage de ton téléphone.</Txt>
        </View>

        <View style={{ gap: 10 }}>
          <H size={18}>Taille du texte</H>
          <Segmented options={SCALES} value={String(textScale)} onChange={(v) => setLook({ textScale: Number(v) })} />
          <View style={{ padding: 14, borderRadius: 20, backgroundColor: colors.neutral100 }}>
            <Txt>Aperçu : « Robe en lin smockée, 2-4 ans, 18,00 € ».</Txt>
          </View>
          <Txt size={13} color={colors.neutral700}>S'ajoute à la taille du texte choisie dans les réglages de ton téléphone.</Txt>
        </View>

        <View style={{ gap: 10 }}>
          <H size={18}>Parent vérifié</H>
          {meVerified ? (
            <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.accent2_100, gap: 8 }}>
              <VerifiedBadge />
              <Txt size={14} color={colors.accent2_800}>Ton identité et ton numéro sont vérifiés. Le badge apparaît sur tes annonces et ton profil.</Txt>
            </View>
          ) : (
            <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <BadgeCheck size={28} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
                <Txt size={14} color={colors.neutral800} style={{ flex: 1 }}>Vérifie ton identité et ton numéro de téléphone : les parents achètent plus volontiers à un parent vérifié.</Txt>
              </View>
              {/* Demo: a real flow would hand over to an identity-verification provider. */}
              <PrimaryButton label="Vérifier mon compte" height={46} size={16} onPress={() => { set({ meVerified: true }); showToast('Compte vérifié ✓'); }} />
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <H size={18}>Commission vendeur (démo)</H>
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
