import { router, useLocalSearchParams } from 'expo-router';
import { Download, Mail, Package } from 'lucide-react-native';
import { View } from 'react-native';

import { Logo } from '../../components/Logo';
import { BackHeader, BottomBar, Screen } from '../../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../../components/ui';
import { fullName } from '../../lib/account';
import { accountOf, productById, useStore } from '../../store/useStore';
import { colors, ICON_STROKE, shadows } from '../../theme/tokens';

/** Deterministic pseudo-random bits from the order id, so the code looks real and stays stable. */
function bits(seed: string, n: number) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: n }, () => { h = Math.imul(h ^ (h >>> 13), 1274126177); return (h >>> 16) & 1; });
}

function QrLike({ seed, size = 132 }: { seed: string; size?: number }) {
  const n = 17;
  const cell = size / n;
  const b = bits(seed, n * n);
  // Three corner "finder" squares, like a real QR code.
  const finder = (r: number, c: number) => [[0, 0], [0, n - 5], [n - 5, 0]].some(([fr, fc]) => r >= fr && r < fr + 5 && c >= fc && c < fc + 5);
  const finderOn = (r: number, c: number) => {
    const [fr, fc] = [[0, 0], [0, n - 5], [n - 5, 0]].find(([a, d]) => r >= a && r < a + 5 && c >= d && c < d + 5)!;
    const y = r - fr, x = c - fc;
    return y === 0 || y === 4 || x === 0 || x === 4 || (y === 2 && x === 2);
  };
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#ffffff' }}>
      {b.map((v, i) => {
        const r = Math.floor(i / n), c = i % n;
        const on = finder(r, c) ? finderOn(r, c) : v === 1;
        return <View key={i} style={{ width: cell, height: cell, backgroundColor: on ? '#201e1d' : '#ffffff' }} />;
      })}
    </View>
  );
}

function Barcode({ seed }: { seed: string }) {
  const b = bits(seed + 'bar', 46);
  return (
    <View style={{ flexDirection: 'row', height: 54, alignItems: 'stretch', backgroundColor: '#ffffff', paddingHorizontal: 8 }}>
      {b.map((v, i) => <View key={i} style={{ width: v ? 3 : 1.5, marginRight: 1.5, backgroundColor: '#201e1d' }} />)}
    </View>
  );
}

const Block = ({ title, lines }: { title: string; lines: string[] }) => (
  <View style={{ flex: 1, gap: 2 }}>
    <Txt size={10} weight="bold" color="#645c50" style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>{title}</Txt>
    {lines.map((l) => <Txt key={l} size={13} color="#201e1d">{l}</Txt>)}
  </View>
);

/** Bordereau d'envoi for a sale: a printable-looking label, plus "parcel dropped off". */
export default function Label() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sale = useStore((s) => s.sales.find((o) => o.id === id));
  const mine = useStore((s) => s.mine);
  const updateOrder = useStore((s) => s.updateOrder);
  const showToast = useStore((s) => s.showToast);
  const me = useStore(accountOf);
  if (!sale) return <Screen><Txt style={{ padding: 20 }}>Vente introuvable.</Txt></Screen>;

  const p = productById(mine, sale.pid)!;
  const code = `PIM-${sale.id.replace(/\D/g, '').padStart(4, '0').slice(-6)}-${p.id}`;
  const relais = sale.del === 'Point relais';
  const dropped = sale.status >= 1;

  if (sale.del === 'Main propre') {
    return (
      <Screen contentStyle={{ paddingHorizontal: 20 }}>
        <View style={{ gap: 16, paddingTop: 4 }}>
          <BackHeader title="Bordereau" />
          <Txt color={colors.neutral800}>Pas besoin de bordereau : cette vente se fait en main propre. Fixe le rendez-vous avec {sale.buyer} dans la messagerie.</Txt>
        </View>
      </Screen>
    );
  }

  const bottom = (
    <BottomBar>
      <PrimaryButton
        label={dropped ? 'Colis déjà déposé ✓' : "J'ai déposé le colis"}
        disabledLook={dropped}
        onPress={() => { if (dropped) return; updateOrder(sale.id, { status: 1 }); showToast('Super ! L\'acheteur est prévenu.'); router.back(); }}
        style={{ flex: 1 }}
      />
    </BottomBar>
  );

  return (
    <Screen bottom={bottom} contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Ton bordereau" />
        <Txt color={colors.neutral800}>Tu as vendu « {p.title} » à {sale.buyer} 🎉 Voici ton bordereau d'envoi, déjà payé par l'acheteur.</Txt>

        {/* The label itself stays white like paper, in light and dark mode. */}
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: '#ffffff', gap: 14, boxShadow: shadows.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo size={20} />
            <Txt size={12} weight="bold" color="#201e1d">{relais ? 'Point relais' : 'Colissimo · domicile'}</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Block title="Expéditeur" lines={[fullName(me), me.street, `${me.zip} ${me.city}`.trim()].filter(Boolean)} />
            <Block title="Destinataire" lines={relais ? [sale.buyer ?? 'Acheteur', 'Relais Tabac du Parc', '12 rue Oberkampf, Paris 11e'] : [sale.buyer ?? 'Acheteur', 'Adresse transmise au transporteur']} />
          </View>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <QrLike seed={code} />
            <View style={{ flex: 1, gap: 6 }}>
              <Txt size={10} weight="bold" color="#645c50" style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>N° de suivi</Txt>
              <Txt size={15} weight="bold" color="#201e1d">{code}</Txt>
              <Txt size={12} color="#645c50">Colis ≤ 1 kg · {p.type === 'lot' ? `Lot de ${p.count} pièces` : 'Pièce unique'}</Txt>
            </View>
          </View>
          <Barcode seed={code} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OutlineButton label="Télécharger" size={15} height={48} onPress={() => showToast('Bordereau enregistré (PDF)')} style={{ flex: 1 }} />
          <OutlineButton label="Par e-mail" size={15} height={48} onPress={() => showToast('Bordereau envoyé par e-mail')} style={{ flex: 1 }} />
        </View>

        <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 10 }}>
          <H size={18}>Comment l'envoyer</H>
          {[
            [Package, 'Emballe le vêtement, propre et plié, dans un sac ou un carton.'],
            [Download, relais ? 'Imprime le bordereau et colle-le sur le colis, ou montre simplement le QR code au relais.' : 'Imprime le bordereau et colle-le bien à plat sur le colis.'],
            [Mail, relais ? 'Dépose-le au point relais de ton choix sous 3 jours.' : 'Dépose-le en bureau de poste sous 3 jours.'],
          ].map(([Icon, t], i) => {
            const I = Icon as typeof Package;
            return (
              <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent2_100, alignItems: 'center', justifyContent: 'center' }}>
                  <I size={17} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
                </View>
                <Txt size={14} style={{ flex: 1 }}>{t as string}</Txt>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
