import { Href, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { VerifiedBadge } from '../../components/Badges';
import { ImpactTree } from '../../components/ImpactTree';
import { Screen } from '../../components/Screen';
import { Avatar, H, PrimaryButton, Txt } from '../../components/ui';
import { cityLabel, fullName, initial } from '../../lib/account';
import { currentUser } from '../../lib/backend';
import { fmtInt, plural } from '../../lib/format';
import { TREE_STAGES, treeStage } from '../../lib/impact';
import { useNotifications } from '../../lib/notifications';
import { accountOf, impactStats, useStore } from '../../store/useStore';
import { colors, ICON_STROKE } from '../../theme/tokens';

export default function Profile() {
  const s = useStore();
  const impact = impactStats(s);
  const a = accountOf(s);
  const me = currentUser()?.id;
  const unread = useNotifications().filter((n) => n.unread).length;

  const rows: { label: string; meta: string; href: Href }[] = [
    { label: 'Mes informations', meta: a.email, href: '/account' },
    { label: 'Mes achats', meta: String(s.realOrders.filter((o) => o.buyerId === me).length), href: '/orders?tab=achats' },
    { label: 'Mes ventes', meta: String(s.realOrders.filter((o) => o.sellerId === me).length), href: '/orders?tab=ventes' },
    { label: 'Mes versements', meta: s.payout?.ready ? 'Activés' : 'À activer', href: '/payouts' },
    { label: 'Favoris', meta: String(s.favs.length), href: '/favorites' },
    { label: 'Passeports de mes enfants', meta: s.kids.map((k) => k.name).join(', ') || '—', href: '/kids' },
    { label: 'Notifications', meta: unread ? plural(unread, 'nouvelle') : '—', href: '/notifications' },
    { label: 'Mon dressing', meta: plural(s.mine.length, 'annonce'), href: '/seller/me' },
    { label: 'Mon impact', meta: `${impact.pieces} vêtements`, href: '/impact' },
    { label: 'Comment ça marche', meta: 'Guide', href: '/guide' },
    { label: 'Guide des états', meta: 'Neuf, très bon…', href: '/conditions' },
    { label: 'Informations légales', meta: 'CGU, confidentialité', href: '/legal' },
    { label: 'Réglages', meta: 'Affichage, compte', href: '/settings' },
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        {s.signedIn ? (
          <Pressable onPress={() => router.push('/account')} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Avatar init={initial(a)} size={76} bg={colors.accent300} font={30} />
            <View style={{ gap: 4, flex: 1 }}>
              <H size={26} numberOfLines={1}>{fullName(a) || a.email}</H>
              <Txt size={14} color={colors.neutral700}>{[cityLabel(a), s.myCard && (s.myCard.reviews ? `★ ${s.myCard.rating} (${s.myCard.reviews} avis)` : 'Nouveau sur Pimou')].filter(Boolean).join(' · ')}</Txt>
              {s.meVerified && <VerifiedBadge small />}
            </View>
          </Pressable>
        ) : (
          <View style={{ padding: 20, borderRadius: 30, backgroundColor: colors.neutral100, gap: 12 }}>
            <H size={22}>Tu n'es pas connecté·e</H>
            <Txt size={14} color={colors.neutral800}>Connecte-toi pour acheter, vendre, faire des offres et retrouver tes messages.</Txt>
            <PrimaryButton label="Me connecter" height={50} size={16} onPress={() => router.push('/login')} />
            <Pressable onPress={() => router.push('/login?mode=signup')} style={{ alignSelf: 'center', padding: 4 }}>
              <Txt size={14} weight="semi" color={colors.accent700}>Créer un compte</Txt>
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => router.push('/impact')} style={({ pressed }) => ({ padding: 18, borderRadius: 28, backgroundColor: colors.accent2_100, flexDirection: 'row', alignItems: 'center', gap: 14, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <ImpactTree stage={treeStage(impact.pieces)} size={56} bg={colors.neutral100} />
          <View style={{ flex: 1 }}>
            <H size={20} color={colors.accent2_800}>{impact.pieces} vêtements sauvés</H>
            <Txt size={13} color={colors.accent2_800}>Ton arbre : {TREE_STAGES[treeStage(impact.pieces)].label} · ≈ {fmtInt(impact.co2Kg)} kg de CO₂ économisés</Txt>
          </View>
          <ChevronRight size={18} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
        </Pressable>

        <View style={{ borderRadius: 30, backgroundColor: colors.neutral100, overflow: 'hidden' }}>
          {rows.filter((r) => s.signedIn || (r.href !== '/account' && r.href !== '/payouts')).map((r, i) => (
            <Pressable
              key={r.label}
              onPress={() => router.push(r.href)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18,
                backgroundColor: pressed ? colors.neutral200 : 'transparent',
                borderBottomWidth: i < rows.length - (s.signedIn ? 1 : 3) ? 1 : 0, borderBottomColor: colors.divider,
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
