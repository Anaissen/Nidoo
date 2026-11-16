import { useState } from 'react';
import { View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, PrimaryButton, Txt } from '../components/ui';
import { fmt } from '../lib/format';
import { checkPrices, PriceRow } from '../lib/payments';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

const GROUPS = [
  { id: 'relais', title: 'Point relais · Mondial Relay' },
  { id: 'domicile', title: 'À domicile · Colissimo' },
] as const;
const kg = (n: number) => `${String(n).replace('.', ',')} kg`;

/**
 * For Pimou's owner, not linked from the app: Boxtal's real price for each parcel bracket next to what Pimou
 * charges, to set the shipping prices. Works while Boxtal is in test mode (the test labels are free and cancelled).
 */
export default function CheckPrices() {
  const signedIn = useStore((s) => s.signedIn);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true); setError(null); setRows(null);
    const r = await checkPrices();
    setBusy(false);
    if (r.error) setError(r.error);
    else setRows(r.rows ?? []);
  };

  if (!signedIn) return <Screen><BackHeader title="Vérifier les prix" style={{ margin: 20 }} /><Txt style={{ padding: 20 }}>Connecte-toi d'abord.</Txt></Screen>;

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4, paddingBottom: 24 }}>
        <BackHeader title="Vérifier les prix" />
        <Txt color={colors.neutral800}>
          Pour chaque taille de colis, Pimou commande un bordereau de test chez Boxtal, relève son prix, puis l'annule. C'est gratuit tant que Boxtal est en mode test. Compte environ 30 secondes.
        </Txt>
        <PrimaryButton label={busy ? 'Vérification en cours…' : 'Lancer la vérification'} height={56} onPress={() => void run()} disabledLook={busy} />
        {error && <Txt color={colors.accent700}>{error}</Txt>}
        {rows && GROUPS.map((g) => (
          <View key={g.id} style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 12 }}>
            <H size={18}>{g.title}</H>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Txt size={12} weight="semi" color={colors.neutral700} style={{ flex: 1.3 }}>Colis</Txt>
              <Txt size={12} weight="semi" color={colors.neutral700} style={{ flex: 1, textAlign: 'right' }}>Boxtal TTC</Txt>
              <Txt size={12} weight="semi" color={colors.neutral700} style={{ flex: 1, textAlign: 'right' }}>Prix Pimou</Txt>
              <Txt size={12} weight="semi" color={colors.neutral700} style={{ flex: 1, textAlign: 'right' }}>Marge</Txt>
            </View>
            {rows.filter((r) => r.delivery === g.id).map((r) => (
              <View key={r.kg} accessibilityLabel={`${g.id} ${r.parcel}`} style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
                  <Txt size={14} weight="semi" style={{ flex: 1.3 }}>{/kg$/.test(r.parcel) ? r.parcel : `${r.parcel} (${kg(r.kg)})`}</Txt>
                  <Txt size={14} style={{ flex: 1, textAlign: 'right' }}>{r.boxtalTtc == null ? '–' : fmt(r.boxtalTtc)}</Txt>
                  <Txt size={14} style={{ flex: 1, textAlign: 'right' }}>{fmt(r.price)}</Txt>
                  <Txt size={14} weight="semi" color={r.margin == null ? colors.neutral700 : r.margin < 0 ? colors.accent700 : colors.accent2_700} style={{ flex: 1, textAlign: 'right' }}>
                    {r.margin == null ? '–' : `${r.margin > 0 ? '+' : ''}${fmt(r.margin)}`}
                  </Txt>
                </View>
                {r.boxtalHt != null && <Txt size={11} color={colors.neutral600}>Boxtal : {fmt(r.boxtalHt)} HT</Txt>}
                {r.error && <Txt size={11} color={colors.accent700}>{r.error}</Txt>}
              </View>
            ))}
          </View>
        ))}
        {rows && (
          <Txt size={12} color={colors.neutral600}>
            Boxtal TTC : le prix Boxtal avec 20 % de TVA, ce que Pimou paie vraiment puisqu'il ne facture pas la TVA. Marge en rouge : ce colis coûte plus qu'il ne rapporte.
          </Txt>
        )}
      </View>
    </Screen>
  );
}
