import { useLocalSearchParams } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Landmark, ShieldCheck, Wallet as WalletIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Reclamation } from '../components/Reclamation';
import { BackHeader, Screen } from '../components/Screen';
import { H, LinkButton, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { fmt } from '../lib/format';
import { loadWallet, openPayoutDashboard, refreshPayout, startOnboarding, withdrawWallet } from '../lib/payments';
import { useStore, WalletMove } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

/**
 * "Mon porte-monnaie": the money of the parent's sales, kept on their own Stripe account until they withdraw it
 * or pay a purchase with it. First, the one-time identity check and IBAN that Stripe needs.
 */
export default function Payouts() {
  const { done } = useLocalSearchParams<{ done?: string }>();
  const payout = useStore((s) => s.payout);
  const wallet = useStore((s) => s.wallet);
  const paymentsTest = useStore((s) => s.paymentsTest);
  const showToast = useStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Coming back from Stripe's form (or simply opening the page): ask Stripe where things stand.
  useEffect(() => {
    void Promise.all([refreshPayout(), loadWallet()]).then(([r]) => {
      setChecking(false);
      if (r.error) showToast(r.error);
      else if (done && r.ready) showToast('Porte-monnaie activé ✓');
    });
  }, [done, showToast]);

  const go = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) showToast(err);
  };
  const withdraw = async () => {
    if (busy) return;
    setBusy(true);
    const r = await withdrawWallet();
    setBusy(false);
    showToast(r.error ?? `${fmt(r.amount)} envoyés vers ton compte bancaire : ils arrivent en quelques jours ouvrés.`);
  };

  const ready = !!payout?.ready;
  const started = !!payout?.submitted;
  const spendable = wallet?.spendable ?? 0;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4, paddingBottom: 12 }}>
        <BackHeader title="Mon porte-monnaie" />

        {checking && !payout ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : ready ? (
          <View style={{ padding: 20, borderRadius: 28, backgroundColor: colors.accent2_100, gap: 10 }}>
            <WalletIcon size={34} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
            <Txt size={14} color={colors.accent2_800}>Disponible</Txt>
            <H size={40} color={colors.accent2_800} accessibilityLabel="Solde disponible">{fmt(wallet?.available ?? 0)}</H>
            {!!wallet?.pending && <Txt size={13} color={colors.accent2_800}>+ {fmt(wallet.pending)} en cours : disponibles d'ici quelques jours, le temps que la banque de l'acheteur confirme le paiement.</Txt>}
            {!!wallet?.reserved && <Txt size={13} color={colors.accent2_800}>Dont {fmt(wallet.reserved)} réservés pour un paiement en cours.</Txt>}
            <PrimaryButton
              label={busy ? 'Un instant…' : spendable >= 1 ? `Retirer ${fmt(spendable)}` : 'Rien à retirer pour l\'instant'}
              height={52} size={16} onPress={() => void withdraw()} disabledLook={busy || spendable < 1}
            />
            <Txt size={13} color={colors.accent2_800}>
              Le retrait part vers le compte bancaire que tu as indiqué à Stripe et arrive en quelques jours ouvrés. Tu peux aussi garder l'argent pour tes achats : au moment de payer, coche « Utiliser mon porte-monnaie ».
            </Txt>
          </View>
        ) : (
          <View style={{ padding: 20, borderRadius: 28, backgroundColor: colors.neutral100, gap: 12 }}>
            <Landmark size={36} strokeWidth={ICON_STROKE} color={colors.accent700} />
            <H size={22}>{started ? 'Encore une petite étape' : 'Active ton porte-monnaie pour vendre'}</H>
            <Txt size={14} color={colors.neutral800}>
              {started
                ? "Stripe vérifie tes informations ou a besoin d'un complément. Reprends le formulaire pour terminer."
                : "L'argent de tes ventes arrive dans ton porte-monnaie. Pour l'ouvrir, indique ton identité et ton IBAN une seule fois : c'est obligatoire en Europe pour vendre en ligne."}
            </Txt>
            <PrimaryButton label={busy ? 'Ouverture…' : started ? 'Reprendre' : 'Activer mon porte-monnaie'} height={52} onPress={() => go(startOnboarding)} disabledLook={busy} />
            <OutlineButton label="J'ai terminé, vérifier" height={46} size={15} onPress={() => { setChecking(true); void refreshPayout().then((r) => { setChecking(false); if (r.error) showToast(r.error); else showToast(r.ready ? 'Porte-monnaie activé ✓' : 'Pas encore validé par Stripe'); }); }} />
            {!!wallet?.available && <Txt size={13} color={colors.neutral800}>Il y a déjà {fmt(wallet.available)} dans ton porte-monnaie : tu pourras les retirer une fois la vérification terminée.</Txt>}
          </View>
        )}

        {!!wallet?.movements.length && (
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 12 }}>
            <H size={18}>Historique</H>
            {wallet.movements.map((m, i) => <Move key={`${m.created_at}-${i}`} m={m} />)}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 24, backgroundColor: colors.surface }}>
          <ShieldCheck size={22} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
          <Txt size={13} color={colors.neutral800} style={{ flex: 1 }}>
            L'argent de ton porte-monnaie est conservé par Stripe, notre prestataire de paiement agréé, sur un compte à ton nom : pas par Pimou. Pimou ne voit jamais ta pièce d'identité ni tes coordonnées bancaires.
          </Txt>
        </View>
        {ready && <LinkButton label="Voir mon compte Stripe →" size={14} onPress={() => void go(openPayoutDashboard)} style={{ alignSelf: 'flex-start' }} />}
        <Reclamation subject="Réclamation · porte-monnaie" before="Un souci avec ton porte-monnaie ? Écris à " />
        {paymentsTest && (
          <Txt size={12} color={colors.neutral600}>
            🧪 Mode test : aucun vrai argent ne circule. Dans le formulaire Stripe, utilise les données de test proposées (par exemple le code 000 000 pour le téléphone). Pour qu'une vente test arrive tout de suite dans le porte-monnaie, l'acheteur paie avec la carte 4000 0000 0000 0077.
          </Txt>
        )}
      </View>
    </Screen>
  );
}

/** One line of the history: what, when, how much. */
function Move({ m }: { m: WalletMove }) {
  const inward = m.amount > 0;
  const Icon = inward ? ArrowDownLeft : ArrowUpRight;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: inward ? colors.accent2_100 : colors.neutral200 }}>
        <Icon size={16} strokeWidth={ICON_STROKE} color={inward ? colors.accent2_700 : colors.neutral700} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={14} weight="semi" numberOfLines={1}>{m.label}</Txt>
        <Txt size={12} color={colors.neutral700}>{DAY.format(new Date(m.created_at))}</Txt>
      </View>
      <Txt size={14} weight="semi" color={inward ? colors.accent2_700 : colors.text}>{inward ? '+' : '−'}{fmt(Math.abs(m.amount))}</Txt>
    </View>
  );
}
