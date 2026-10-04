import { Href, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { VerifiedBadge } from '../../components/Badges';
import { Screen } from '../../components/Screen';
import { Avatar, H, Txt } from '../../components/ui';
import { fmt, fmtInt } from '../../lib/format';
import { impactStats, myListings, useStore } from '../../store/useStore';
import { colors, ICON_STROKE } from '../../theme/tokens';

export default function Profile() {
  const s = useStore();
  const impact = impactStats(s);

  const rows: { label: string; meta: string; href: Href }[] = [
    { label: 'Mes achats', meta: String(s.purchases.length), href: '/orders?tab=achats' },
    { label: 'Mes ventes', meta: String(s.sales.length), href: '/orders?tab=ventes' },
    { label: 'Favoris', meta: String(s.favs.length), href: '/favorites' },
    { label: 'Passeports de mes enfants', meta: s.kids.map((k) => k.name).join(', ') || '—', href: '/kids' },
    { label: 'Notifications', meta: '2 nouvelles', href: '/notifications' },
    { label: 'Mon dressing public', meta: `${myListings(s.mine).length} annonces`, href: '/seller/me' },
    { label: 'Mon impact', meta: `${impact.pieces} vêtements`, href: '/impact' },
    { label: 'Comment ça marche', meta: 'Guide', href: '/guide' },
    { label: 'Guide des états', meta: 'Neuf, très bon…', href: '/conditions' },
    { label: 'Réglages', meta: s.meVerified ? 'Affichage, compte' : 'Vérifier mon compte', href: '/settings' },
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Avatar init="É" size={76} bg={colors.accent300} font={30} />
          <View style={{ gap: 4 }}>
            <H size={26}>Élodie</H>
            <Txt size={14} color={colors.neutral700}>Paris 11e · ★ 4,9 (12 avis)</Txt>
            {s.meVerified && <VerifiedBadge small />}
          </View>
        </View>

        <Pressable onPress={() => router.push('/impact')} style={({ pressed }) => ({ padding: 18, borderRadius: 28, backgroundColor: colors.accent2_100, flexDirection: 'row', alignItems: 'center', gap: 14, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <Txt size={34} lh={1.15}>🌱</Txt>
          <View style={{ flex: 1 }}>
            <H size={20} color={colors.accent2_800}>{impact.pieces} vêtements sauvés</H>
            <Txt size={13} color={colors.accent2_800}>≈ {fmtInt(impact.co2Kg)} kg de CO₂ et {fmtInt(impact.waterL)} L d'eau économisés</Txt>
          </View>
          <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
        </Pressable>

        <View style={{ padding: 20, borderRadius: 32, backgroundColor: colors.accent2_500, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Txt size={13} color={colors.neutral100}>Porte-monnaie</Txt>
            <H size={30} color={colors.neutral100}>{fmt(s.wallet)}</H>
          </View>
          <Pressable onPress={s.withdraw} style={{ height: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.neutral100, justifyContent: 'center' }}>
            <H size={15} color={colors.accent2_800}>Virer</H>
          </Pressable>
        </View>

        <View style={{ borderRadius: 30, backgroundColor: colors.neutral100, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={() => router.push(r.href)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18,
                backgroundColor: pressed ? colors.neutral200 : 'transparent',
                borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: colors.divider,
              })}
            >
              <Txt weight="semi" style={{ flex: 1 }}>{r.label}</Txt>
              <Txt size={13} color={colors.neutral700} numberOfLines={1} style={{ maxWidth: 150 }}>{r.meta}</Txt>
              <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.text} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
