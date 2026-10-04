import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { forwardRef, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, GUTTER, ICON_STROKE } from '../theme/tokens';
import { CircleButton, H } from './ui';

type Props = {
  children: ReactNode;
  /** Fixed action bar pinned under the scroll area (product CTA, sell steps, checkout…). */
  bottom?: ReactNode;
  /** Extra space under the content (e.g. to clear the floating tab bar). */
  padBottom?: number;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fill the viewport and vertically centre content (confirmation screens). */
  centered?: boolean;
  keyboard?: boolean;
};

/** Cream page with the status-bar inset on top and an optional pinned bottom bar. */
export const Screen = forwardRef<ScrollView, Props>(function Screen(
  { children, bottom, padBottom = 24, contentStyle, centered, keyboard }, ref,
) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        ref={ref}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingTop: insets.top + 2, paddingBottom: padBottom },
          centered && { flexGrow: 1, justifyContent: 'center' },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
      {bottom}
    </View>
  );
  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
    </KeyboardAvoidingView>
  );
});

export function BottomBar({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[{
        flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: GUTTER,
        paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.bg,
        borderTopWidth: 1, borderTopColor: colors.divider,
      }, style]}
    >
      {children}
    </View>
  );
}

export const BackButton = ({ onPress = () => router.back(), bg = colors.surface }: { onPress?: () => void; bg?: string }) => (
  <CircleButton bg={bg} onPress={onPress} accessibilityLabel="Retour">
    <ChevronLeft size={20} strokeWidth={ICON_STROKE} color={colors.text} />
  </CircleButton>
);

/** Back button + Caprasimo title, used on every pushed list screen. */
export function BackHeader({ title, style }: { title: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      <BackButton />
      <H size={26}>{title}</H>
    </View>
  );
}
