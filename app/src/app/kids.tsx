import { View } from 'react-native';

import { KidList } from '../components/KidAvatar';
import { BackHeader, Screen } from '../components/Screen';
import { Txt } from '../components/ui';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

/** The children's passports. */
export default function Kids() {
  const kids = useStore((s) => s.kids);
  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 12, paddingTop: 4 }}>
        <BackHeader title="Mes enfants" style={{ marginBottom: 6 }} />
        <KidList />
        {kids.length === 0 && <Txt color={colors.neutral800}>Ajoute un passeport pour personnaliser ton accueil.</Txt>}
      </View>
    </Screen>
  );
}
