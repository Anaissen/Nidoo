import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck, Landmark, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { openPayoutDashboard, refreshPayout, startOnboarding } from '../lib/payments';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

/** "Mes versements": the seller's Stripe account, where the money of their sales arrives. */
export default function Payouts() {
  const { done } = useLocalSearchParams<{ done?: string }>();
  const payout = useStore((s) => s.payout);
  const showToast = useStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Coming back from Stripe's form (or simply opening the page): ask Stripe where things stand.
  useEffect(() => {
    void refreshPayout().then((r) => {
      setChecking(false);
      if (r.error) showToast(r.error);
      else if (done && r.ready) showToast('Paiements activés ✓');
    });
  }, [done, showToast]);

  const go = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) showToast(err);
  };

  const ready = !!payout?.ready;
  const started = !!payout?.submitted;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Mes versements" />

        {checking && !payout ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : ready ? (
          <View style={{ padding: 20, borderRadius: 28, backgroundColor: colors.accent2_100, gap: 10 }}>
            <BadgeCheck size={36} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
            <H size={22} color={colors.accent2_800}>Tes paiements sont activés</H>
            <Txt size={14} color={colors.accent2_800}>Quand un acheteur confirme avoir reçu ton article, l'argent part vers ton compte bancaire. Il arrive en quelques jours ouvrés.</Txt>
            <OutlineButton label="Voir mes versements" height={48} size={16} onPress={() => go(openPayoutDashboard)} />
          </View>
        ) : (
          <View style={{ padding: 20, borderRadius: 28, backgroundColor: colors.neutral100, gap: 12 }}>
            <Landmark size={36} strokeWidth={ICON_STROKE} color={colors.accent700} />
            <H size={22}>{started ? 'Encore une petite étape' : 'Active tes paiements pour vendre'}</H>
            <Txt size={14} color={colors.neutral800}>
              {started
                ? "Stripe vérifie tes informations ou a besoin d'un complément. Reprends le formulaire pour terminer."
                : "Pour recevoir l'argent de tes ventes, indique ton identité et ton IBAN une seule fois. C'est obligatoire en Europe pour vendre en ligne."}
            </Txt>
            <PrimaryButton label={busy ? 'Ouverture…' : started ? 'Reprendre' : 'Activer mes paiements'} height={52} onPress={() => go(startOnboarding)} disabledLook={busy} />
            <OutlineButton label="J'ai terminé, vérifier" height={46} size={15} onPress={() => { setChecking(true); void refreshPayout().then((r) => { setChecking(false); if (r.error) showToast(r.error); else showToast(r.ready ? 'Paiements activés ✓' : 'Pas encore validé par Stripe'); }); }} />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 24, backgroundColor: colors.surface }}>
          <ShieldCheck size={22} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
          <Txt size={13} color={colors.neutral800} style={{ flex: 1 }}>
            Les paiements passent par Stripe, le service utilisé par de nombreuses applis de vente en ligne. Pimou ne voit jamais ta pièce d'identité ni tes coordonnées bancaires.
          </Txt>
        </View>
        <Txt size={12} color={colors.neutral600}>🧪 Mode test : aucun vrai argent ne circule. Dans le formulaire Stripe, utilise les données de test proposées (par exemple le code 000 000 pour le téléphone).</Txt>
      </View>
    </Screen>
  );
}
