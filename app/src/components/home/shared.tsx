import { router } from 'expo-router';
import { Bell, LogIn, ShoppingBag } from 'lucide-react-native';
import { Pressable, useWindowDimensions } from 'react-native';
import { View } from 'react-native';

import { initial } from '../../lib/account';
import { accountOf, TypeFilter, useStore } from '../../store/useStore';
import { colors, ICON_STROKE } from '../../theme/tokens';
import { Avatar, CircleButton, H, Txt } from '../ui';
import type { Filters } from '../../store/useStore';

export function BellButton() {
  return (
    <CircleButton onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
      <Bell size={20} strokeWidth={ICON_STROKE} color={colors.text} />
      <View style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
    </CircleButton>
  );
}

/** Top of the page: "Connexion" when logged out, otherwise the parent's initial (opens the profile). */
export function AccountButton() {
  const signedIn = useStore((s) => s.signedIn);
  const account = useStore(accountOf);
  const { width } = useWindowDimensions();
  if (!signedIn) {
    return (
      <Pressable onPress={() => router.push('/login')} accessibilityLabel="Se connecter" style={({ pressed }) => ({ height: 44, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 })}>
        <LogIn size={18} strokeWidth={ICON_STROKE} color={colors.bg} />
        {width >= 370 && <H size={14} color={colors.bg}>Connexion</H>}
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => router.navigate('/profile')} accessibilityLabel="Mon compte" style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Avatar init={initial(account)} size={44} bg={colors.accent300} font={18} />
    </Pressable>
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
