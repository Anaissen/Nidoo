import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { formatKm } from '../components/Badges';
import { OptionCard } from '../components/OptionCard';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { H, LinkButton, PrimaryButton, Txt } from '../components/ui';
import { DELIVERY, HANDOVER_MAX_KM } from '../data/catalog';
import { useCartGroups } from '../lib/cart';
import { fmt } from '../lib/format';
import { addressLine, fullName, hasAddress } from '../lib/account';
import { payCart } from '../lib/payments';
import { accountOf, useStore } from '../store/useStore';
import { colors, fonts, ICON_STROKE } from '../theme/tokens';


export default function Checkout() {
  const { items, groups, subtotal } = useCartGroups();
  const del = useStore((s) => s.del);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const account = useStore(accountOf);
  const savedOk = hasAddress(account);
  // Home delivery: confirm the saved address or type another one.
  const [addrMode, setAddrMode] = useState<'saved' | 'other'>(savedOk ? 'saved' : 'other');
  const [addr, setAddr] = useState({ name: savedOk ? '' : fullName(account), street: '', zip: '', city: '' });
  const otherOk = !!addr.name.trim() && !!addr.street.trim() && /^\d{5}$/.test(addr.zip.trim()) && !!addr.city.trim();
  const addressMissing = del === 'domicile' && addrMode === 'other' && !otherOk;
  // Hand-to-hand only when every seller in the cart is close enough.
  const far = groups.map((g) => g.seller).filter((sl) => sl.distanceKm > HANDOVER_MAX_KM);
  const options = far.length ? DELIVERY.filter((d) => d.id !== 'main') : DELIVERY;
  useEffect(() => { if (far.length && del === 'main') set({ del: 'relais' }); }, [far.length, del, set]);

  const ship = DELIVERY.find((d) => d.id === del)!.price * groups.length;
  const total = subtotal + ship;

  const [busy, setBusy] = useState(false);

  // Paid through Stripe's page; the money stays with Pimou until the buyer confirms reception.
  const onPay = async () => {
    if (addressMissing) { showToast('Complète ton adresse de livraison'); return; }
    const address = del !== 'domicile' ? '' : addrMode === 'saved' ? addressLine(account) : `${addr.name.trim()}, ${addr.street.trim()}, ${addr.zip.trim()} ${addr.city.trim()}`;
    setBusy(true);
    const err = await payCart(items.map((p) => p.remoteId!), del, address);
    setBusy(false);
    if (err) showToast(err);
  };

  return (
    <Screen
      bottom={<BottomBar><PrimaryButton label={busy ? 'Ouverture du paiement…' : `Payer ${fmt(total)}`} onPress={onPay} disabledLook={!items.length || addressMissing || busy} disabled={!items.length} style={{ flex: 1 }} /></BottomBar>}
      contentStyle={{ paddingHorizontal: 20 }}
    >
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Paiement" />

        <View style={{ gap: 8 }}>
          <H size={18}>Livraison</H>
          {options.map((d) => (
            <OptionCard key={d.id} control="radio" on={del === d.id} title={d.title} sub={d.sub} onPress={() => set({ del: d.id })}
              right={<Txt weight="bold">{d.price ? fmt(d.price) : 'Gratuit'}</Txt>} />
          ))}
          {far.length > 0 && (
            <Txt size={13} color={colors.neutral700}>Main propre indisponible : {far.map((sl) => `${sl.name} (${formatKm(sl.distanceKm)})`).join(', ')} est trop loin.</Txt>
          )}
          {del === 'domicile' ? (
            <View style={{ gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <Txt size={13} weight="semi" color={colors.accent2_800}>Vérifie ton adresse de livraison :</Txt>
              {savedOk && <OptionCard control="radio" on={addrMode === 'saved'} title="Livrer à mon adresse" sub={addressLine(account)} onPress={() => setAddrMode('saved')} />}
              <OptionCard control="radio" on={addrMode === 'other'} title="Livrer à une autre adresse" sub={savedOk ? 'Chez un proche, au travail…' : 'Indique où te livrer'} onPress={() => setAddrMode('other')} />
              {addrMode === 'other' && (
                <View style={{ gap: 8 }}>
                  <TextInput value={addr.name} onChangeText={(t) => setAddr({ ...addr, name: t })} placeholder="Nom et prénom" placeholderTextColor={colors.neutral600} autoComplete="name" style={field()} />
                  <TextInput value={addr.street} onChangeText={(t) => setAddr({ ...addr, street: t })} placeholder="Adresse (numéro et rue)" placeholderTextColor={colors.neutral600} autoComplete="street-address" style={field()} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={addr.zip} onChangeText={(t) => setAddr({ ...addr, zip: t.replace(/[^0-9]/g, '').slice(0, 5) })} placeholder="Code postal" placeholderTextColor={colors.neutral600} keyboardType="number-pad" autoComplete="postal-code" style={[field(), { width: 130 }]} />
                    <TextInput value={addr.city} onChangeText={(t) => setAddr({ ...addr, city: t })} placeholder="Ville" placeholderTextColor={colors.neutral600} style={[field(), { flex: 1 }]} />
                  </View>
                  {!otherOk && <Txt size={12} color={colors.accent2_800}>Remplis les 4 champs pour pouvoir payer.</Txt>}
                </View>
              )}
            </View>
          ) : del === 'main' ? (
            <View style={{ gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <Txt size={13} weight="semi" color={colors.accent2_800}>Retrouvez-vous dans un lieu public et fréquenté : un commerce, le parvis d'une mairie, une gare…</Txt>
              <Txt size={12} color={colors.accent2_800}>Tu fixeras le lieu et l'heure avec le vendeur dans la messagerie. Ne paie jamais en liquide : le paiement reste protégé par Pimou.</Txt>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
              <MapPin size={20} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
              <Txt size={13} color={colors.accent2_800} style={{ flex: 1 }}>Le vendeur dépose ton colis en point relais. Indique-lui dans la messagerie celui qui t'arrange.</Txt>
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <H size={18}>Moyen de paiement</H>
          <View style={{ padding: 16, borderRadius: 24, backgroundColor: colors.neutral100, gap: 6 }}>
            <Txt weight="semi">Carte bancaire, Apple Pay ou Google Pay</Txt>
            <Txt size={13} color={colors.neutral700}>Tu choisiras sur la page de paiement sécurisée de Stripe. Ton argent reste protégé par Pimou jusqu'à ce que tu confirmes la réception.</Txt>
            <Txt size={12} color={colors.accent700}>🧪 Mode test : utilise la carte 4242 4242 4242 4242, une date future et n'importe quel code. Aucun vrai argent n'est prélevé.</Txt>
          </View>
        </View>

        <View style={{ gap: 8, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 28, backgroundColor: colors.surface }}>
          <Line l={`Articles (${items.length})`} r={fmt(subtotal)} />
          <Line l={`Livraison (${groups.length} colis)`} r={ship ? fmt(ship) : 'Gratuit'} />
          <Line l="Protection acheteur" r="Offerte" muted />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Txt size={17} weight="bold">Total</Txt>
            <Txt size={17} weight="bold">{fmt(total)}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4 }}>
          <Txt size={12} color={colors.neutral700}>En payant, tu acceptes les</Txt>
          <LinkButton label="conditions d'utilisation de Pimou." size={12} onPress={() => router.push('/legal/cgu')} />
        </View>
      </View>
    </Screen>
  );
}

const Line = ({ l, r, muted }: { l: string; r: string; muted?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{l}</Txt>
    <Txt size={14} color={muted ? colors.neutral700 : colors.text}>{r}</Txt>
  </View>
);

const field = () => ({
  height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100,
  paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0,
} as const);
