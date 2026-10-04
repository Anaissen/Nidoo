import { router } from 'expo-router';
import { Bell, ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';

import { TypeFilter, useStore } from '../../store/useStore';
import { colors, ICON_STROKE } from '../../theme/tokens';
import { CircleButton, Txt } from '../ui';
import type { Filters } from '../../store/useStore';

export function BellButton() {
  return (
    <CircleButton onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
      <Bell size={20} strokeWidth={ICON_STROKE} color={colors.text} />
      <View style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
    </CircleButton>
  );
}

export function CartButton() {
  const count = useStore((s) => s.cart.length);
  return (
    <CircleButton onPress={() => router.push('/cart')} accessibilityLabel="Panier">
      <ShoppingBag size={20} strokeWidth={ICON_STROKE} color={colors.text} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: 2, right: 0, minWidth: 18, height: 18, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Txt size={11} weight="bold" color={colors.bg} lh={1}>{count}</Txt>
        </View>
      )}
    </CircleButton>
  );
}

/** Reset the search tab to these filters and switch to it. */
export function useSearchWith() {
  const searchWith = useStore((s) => s.searchWith);
  return (patch: { f?: Partial<Filters>; ftype?: TypeFilter }) => {
    searchWith(patch);
    router.navigate('/search');
  };
}
