import { Droplets, Leaf, Shirt } from 'lucide-react-native';
import { View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, Txt } from '../components/ui';
import { ImpactTree } from '../components/ImpactTree';
import { fmtInt } from '../lib/format';
import { nextTree, TREE_STAGES, treeStage } from '../lib/impact';
import { IMPACT_PER_PIECE, impactStats, useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';


/** Compteur d'impact: pieces given a second life, with rough CO₂ / water equivalents. */
export default function Impact() {
  const purchases = useStore((s) => s.purchases);
  const sales = useStore((s) => s.sales);
  const mine = useStore((s) => s.mine);
  const { pieces, co2Kg, waterL } = impactStats({ purchases, sales, mine });
  const stage = treeStage(pieces);
  const next = nextTree(pieces);

  const stats = [
    { Icon: Shirt, big: fmtInt(pieces), small: 'vêtements avec une seconde vie', bg: colors.accent100, fg: colors.accent800 },
    { Icon: Leaf, big: `≈ ${fmtInt(co2Kg)} kg`, small: 'de CO₂ évités', bg: colors.accent2_100, fg: colors.accent2_800 },
    { Icon: Droplets, big: `≈ ${fmtInt(waterL)} L`, small: "d'eau économisés", bg: colors.surface, fg: colors.neutral900 },
  ];

  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Mon impact" />
        <Txt color={colors.neutral800}>Chaque vêtement acheté ou revendu sur Pimou, c'est un vêtement neuf en moins à fabriquer. Et ton arbre grandit !</Txt>

        <View style={{ padding: 20, borderRadius: 32, backgroundColor: colors.accent2_100, alignItems: 'center', gap: 10 }}>
          <ImpactTree stage={stage} size={180} bg={colors.neutral100} />
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Txt size={13} weight="semi" color={colors.accent2_800}>TON ARBRE</Txt>
            <H size={28} color={colors.accent2_800}>{TREE_STAGES[stage].label}</H>
          </View>
          {next ? (
            <View style={{ alignSelf: 'stretch', gap: 6 }}>
              <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.neutral100, overflow: 'hidden' }}>
                <View style={{ height: 10, width: `${Math.max(4, next.progress * 100)}%`, borderRadius: 999, backgroundColor: colors.accent2_600 }} />
              </View>
              <Txt size={14} color={colors.accent2_800} style={{ textAlign: 'center' }}>
                Encore {next.left} vêtement{next.left > 1 ? 's' : ''} pour devenir « {next.label} »
              </Txt>
            </View>
          ) : (
            <Txt size={14} color={colors.accent2_800}>Tous les paliers atteints, bravo ! 🎉</Txt>
          )}
        </View>
        {stats.map(({ Icon, big, small, bg, fg }) => (
          <View key={small} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 28, backgroundColor: bg }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.neutral100, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={26} strokeWidth={ICON_STROKE} color={fg} />
            </View>
            <View style={{ flex: 1 }}>
              <H size={28} color={fg}>{big}</H>
              <Txt size={14} color={fg}>{small}</Txt>
            </View>
          </View>
        ))}

        <View style={{ padding: 18, borderRadius: 28, backgroundColor: colors.neutral100, gap: 12 }}>
          <H size={18}>Tes paliers</H>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {TREE_STAGES.slice(1).map((m, j) => {
              const i = j + 1;
              const on = i <= stage;
              return (
                <View key={m.n} style={{ alignItems: 'center', gap: 4, width: '24%', opacity: on ? 1 : 0.45 }}>
                  <View style={{ borderRadius: 32, borderWidth: 3, borderColor: i === stage ? colors.accent2_600 : 'transparent' }}>
                    <ImpactTree stage={i} size={58} bg={on ? colors.accent2_200 : colors.surface} />
                  </View>
                  <Txt size={11} weight="semi" style={{ textAlign: 'center' }}>{m.label}</Txt>
                  <Txt size={11} color={colors.neutral700}>{m.n} vêtements</Txt>
                </View>
              );
            })}
          </View>
        </View>

        <Txt size={12} color={colors.neutral600}>
          Estimations moyennes, pour donner un ordre de grandeur : environ {IMPACT_PER_PIECE.co2Kg} kg de CO₂ et {fmtInt(IMPACT_PER_PIECE.waterL)} L d'eau par vêtement d'enfant qu'on n'a pas eu besoin de fabriquer. Sont comptés tes achats et tes ventes ; un lot compte chacune de ses pièces.
        </Txt>
      </View>
    </Screen>
  );
}
