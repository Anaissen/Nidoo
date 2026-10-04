import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Screen } from '../components/Screen';
import { H, OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { colors, ICON_STROKE } from '../theme/tokens';

export default function OrderDone() {
  const { oid } = useLocalSearchParams<{ oid: string }>();
  return (
    <Screen centered contentStyle={{ padding: 24 }}>
      <View style={{ gap: 20 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={44} strokeWidth={ICON_STROKE} color={colors.bg} />
        </View>
        <H size={36}>Commande confirmée</H>
        <Txt color={colors.neutral800}>Le vendeur a 3 jours pour expédier. Ton paiement reste protégé jusqu'à ce que tu confirmes la réception.</Txt>
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Suivre ma commande" onPress={() => router.replace(`/tracking/${oid}`)} />
          <OutlineButton label="Retour à l'accueil" onPress={() => { router.dismissAll(); router.navigate('/home'); }} />
        </View>
      </View>
    </Screen>
  );
}
