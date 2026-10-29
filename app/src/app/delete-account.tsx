import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { deleteAccount } from '../lib/payments';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

const GONE = ['Ton profil et tes informations', 'Les passeports de tes enfants', 'Tes annonces et leurs photos', 'Tes conversations et tes favoris'];
const KEPT = [
  'Tes commandes passées, sans ton nom ni ton adresse, pour la comptabilité (10 ans)',
  "La trace de ton acceptation des conditions d'utilisation (5 ans)",
  'Si tu as vendu : ton e-mail et le lien vers ton compte de paiement Stripe, pour les déclarations aux impôts',
  'Les avis que tu as laissés, sans ton nom',
];

/** "Supprimer mon compte": what goes, what the law keeps, then for good. */
export default function DeleteAccount() {
  const signedIn = useStore((s) => s.signedIn);
  const showToast = useStore((s) => s.showToast);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  const go = async () => {
    if (!sure) { showToast('Coche la case pour confirmer'); return; }
    if (busy) return;
    setBusy(true);
    const err = await deleteAccount();
    setBusy(false);
    if (err) { setRefusal(err); return; }
    router.dismissAll();
    router.replace('/home');
    showToast('Ton compte a été supprimé. Merci d\'avoir utilisé Pimou 🌱');
  };

  if (!signedIn) return <Screen><BackHeader title="Supprimer mon compte" style={{ margin: 20 }} /><Txt style={{ padding: 20 }}>Connecte-toi d'abord au compte à supprimer.</Txt></Screen>;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Supprimer mon compte" />
        <Txt color={colors.neutral800}>La suppression est immédiate et définitive : tu ne pourras pas récupérer ton compte.</Txt>

        <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 10 }}>
          <H size={18}>Supprimé tout de suite</H>
          {GONE.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <X size={16} strokeWidth={3} color={colors.accent700} /><Txt size={14} style={{ flex: 1 }}>{t}</Txt>
            </View>
          ))}
        </View>
        <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.surface, gap: 10 }}>
          <H size={18}>Gardé, parce que la loi l'impose</H>
          {KEPT.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Check size={16} strokeWidth={3} color={colors.accent2_700} style={{ marginTop: 3 }} /><Txt size={14} color={colors.neutral800} style={{ flex: 1 }}>{t}</Txt>
            </View>
          ))}
        </View>
        <Txt size={13} color={colors.neutral700}>Une commande en cours doit d'abord être terminée (article reçu), pour que personne n'attende un colis ou son argent.</Txt>

        {refusal && (
          <View style={{ padding: 14, borderRadius: 20, backgroundColor: colors.accent100 }}>
            <Txt size={14} color={colors.accent800}>{refusal}</Txt>
          </View>
        )}

        <Pressable onPress={() => setSure(!sure)} accessibilityRole="checkbox" accessibilityState={{ checked: sure }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: sure ? colors.accent700 : colors.neutral500, backgroundColor: sure ? colors.accent700 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {sure && <Check size={16} strokeWidth={3} color={colors.neutral100} />}
          </View>
          <Txt size={14} style={{ flex: 1 }}>Je comprends que la suppression de mon compte est définitive.</Txt>
        </Pressable>
        <PrimaryButton
          label={busy ? 'Suppression…' : 'Supprimer mon compte'}
          onPress={go}
          disabledLook={!sure || busy}
          style={{ backgroundColor: colors.accent700 }}
        />
        <OutlineButton label="Garder mon compte" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
