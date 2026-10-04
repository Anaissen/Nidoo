import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Screen } from '../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { fmt } from '../lib/format';
import { commissionRate, productById, useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';

export default function SellDone() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mine = useStore((s) => s.mine);
  const commission = useStore((s) => s.commission);
  const p = productById(mine, Number(id));

  return (
    <Screen centered contentStyle={{ padding: 24 }}>
      <View style={{ gap: 20 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent2_500, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={44} strokeWidth={ICON_STROKE} color={colors.neutral100} />
        </View>
        <H size={36}>C'est en ligne !</H>
        {p && (
          <Txt color={colors.neutral800}>
            Ton annonce « {p.title} » est visible par les parents qui cherchent du {p.size}. Tu recevras {fmt(p.price * (1 - commissionRate(commission)))} à la vente.
          </Txt>
        )}
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Voir mon annonce" onPress={() => router.replace(`/product/${id}`)} />
          <OutlineButton label="Vendre autre chose" onPress={() => router.replace('/sell')} />
        </View>
      </View>
    </Screen>
  );
}
