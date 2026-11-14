import { Check, MapPin, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { findRelays } from '../lib/payments';
import type { Relay } from '../store/useStore';
import { colors, fonts, ICON_STROKE } from '../theme/tokens';
import { Txt } from './ui';

const km = (m?: number | null) => (m == null ? '' : m < 1000 ? ` · ${m} m` : ` · ${(m / 1000).toFixed(1).replace('.', ',')} km`);

/**
 * The buyer picks the Mondial Relay point where the parcel goes, near a postcode (theirs by default).
 * `onUnavailable`: labels aren't set up on the server yet, the seller picks the relay as before.
 */
export function RelayPicker({ zip, city, value, onChange, onUnavailable }: {
  zip: string; city: string; value: Relay | null; onChange: (r: Relay) => void; onUnavailable: () => void;
}) {
  const [q, setQ] = useState(zip);
  const [points, setPoints] = useState<Relay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (postalCode = q) => {
    if (!/^\d{5}$/.test(postalCode.trim())) { setError('Indique un code postal à 5 chiffres'); return; }
    setBusy(true); setError(null);
    const r = await findRelays(postalCode.trim(), postalCode.trim() === zip ? city : '');
    setBusy(false);
    if (r.unavailable) { onUnavailable(); return; }
    setError(r.error ?? (r.points.length ? null : 'Aucun point relais trouvé près de ce code postal.'));
    setPoints(r.points);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (/^\d{5}$/.test(zip)) void search(zip); }, []);

  return (
    <View style={{ gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.accent2_100 }}>
      <Txt size={13} weight="semi" color={colors.accent2_800}>Choisis ton point relais Mondial Relay :</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={q}
          onChangeText={(t) => setQ(t.replace(/[^0-9]/g, '').slice(0, 5))}
          onSubmitEditing={() => void search()}
          placeholder="Code postal"
          placeholderTextColor={colors.neutral600}
          keyboardType="number-pad"
          accessibilityLabel="Code postal du point relais"
          style={{ flex: 1, height: 46, borderRadius: 999, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.neutral100, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0 }}
        />
        <Pressable onPress={() => void search()} accessibilityLabel="Chercher les points relais" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent2_700, alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <ActivityIndicator color={colors.neutral100} /> : <Search size={18} strokeWidth={ICON_STROKE} color={colors.neutral100} />}
        </Pressable>
      </View>
      {error && <Txt size={12} color={colors.accent700}>{error}</Txt>}
      {points?.map((p) => {
        const on = value?.code === p.code;
        return (
          <Pressable key={p.code} onPress={() => onChange(p)} accessibilityRole="radio" accessibilityState={{ checked: on }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: colors.neutral100, borderWidth: 2, borderColor: on ? colors.accent2_600 : 'transparent' }}>
            <MapPin size={18} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="semi">{p.name}</Txt>
              <Txt size={12} color={colors.neutral700}>{p.street}, {p.zip} {p.city}{km(p.distance)}</Txt>
            </View>
            {on && <Check size={18} strokeWidth={3} color={colors.accent2_700} />}
          </Pressable>
        );
      })}
      <Txt size={12} color={colors.accent2_800}>Tu recevras un SMS quand ton colis y arrivera.</Txt>
    </View>
  );
}
