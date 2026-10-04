import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme/tokens';
import { H } from './ui';

/** A little sage sprig: curved stem with four soft leaves. */
export function Sprig({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 22c1.2-5.6 4-10.6 10-16" stroke={colors.accent2_700} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M15.5 6.5C15.4 3.3 17.9 1 21.5 1.2c.3 3.4-2.3 6-6 5.3Z" fill={colors.accent2_500} />
      <Path d="M10.8 11.6C7.6 11.3 5.6 8.6 6.1 5.4c3.3.3 5.4 3 4.7 6.2Z" fill={colors.accent2_400} />
      <Path d="M11.9 12.4c2.8-1.8 6.1-1.2 7.8 1.5-2.8 1.8-6.1 1.2-7.8-1.5Z" fill={colors.accent2_600} />
      <Path d="M8.3 16.8c-2.6-.2-4.3-2.3-4-4.9 2.6.2 4.3 2.4 4 4.9Z" fill={colors.accent2_500} />
    </Svg>
  );
}

/** "pimou" wordmark in Caprasimo with the sprig tucked against the last letter. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityRole="header" accessibilityLabel="pimou">
      <H size={size} color={colors.accent} lh={1.1}>pimou</H>
      <View style={{ marginLeft: 1, marginBottom: size * 0.28 }}>
        <Sprig size={Math.round(size * 1.05)} />
      </View>
    </View>
  );
}
