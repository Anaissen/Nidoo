import { BadgeCheck, MapPin, Shirt } from 'lucide-react-native';
import { View } from 'react-native';

import { Seller } from '../data/catalog';
import { colors } from '../theme/tokens';
import { Txt } from './ui';

const Pill = ({ icon, label, bg, fg, small }: { icon: React.ReactNode; label: string; bg: string; fg: string; small?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: small ? 2 : 4, paddingHorizontal: small ? 8 : 10, borderRadius: 999, backgroundColor: bg }}>
    {icon}
    <Txt size={small ? 11 : 12} weight="bold" color={fg} lh={1.3}>{label}</Txt>
  </View>
);

/** "Parent vérifié": identity and phone number checked by Nidoo. */
export const VerifiedBadge = ({ small }: { small?: boolean }) => (
  <Pill small={small} label="Parent vérifié" bg={colors.accent2_100} fg={colors.accent2_800} icon={<BadgeCheck size={small ? 12 : 14} strokeWidth={2.75} color={colors.accent2_800} />} />
);

/** "Lavé et plié": promised by the seller, confirmed by buyers on reception. */
export const WashedBadge = ({ small }: { small?: boolean }) => (
  <Pill small={small} label="Lavé et plié" bg={colors.accent100} fg={colors.accent800} icon={<Shirt size={small ? 12 : 14} strokeWidth={2.75} color={colors.accent800} />} />
);

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`);

export const DistancePill = ({ seller, small }: { seller: Seller; small?: boolean }) => (
  <Pill small={small} label={`À ${formatKm(seller.distanceKm)}`} bg={colors.surface} fg={colors.neutral800} icon={<MapPin size={small ? 12 : 14} strokeWidth={2.75} color={colors.neutral800} />} />
);
