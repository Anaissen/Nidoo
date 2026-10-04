import { ReactNode, useId } from 'react';
import {
  Platform, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle,
} from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { colors, fonts, shadows } from '../theme/tokens';

// ─── Text ────────────────────────────────────────────────────────────────────

type Weight = 'regular' | 'semi' | 'bold' | 'heading';
const family: Record<Weight, string> = { regular: fonts.body, semi: fonts.bodySemi, bold: fonts.bodyBold, heading: fonts.heading };

export type TxtProps = TextProps & { size?: number; weight?: Weight; color?: string; lh?: number };

/** Body text in Figtree; `weight="heading"` switches to Caprasimo. Line-height defaults to the prototype's 1.45. */
export function Txt({ size = 15, weight = 'regular', color = colors.text, lh, style, ...rest }: TxtProps) {
  const lineHeight = Math.round(size * (lh ?? (weight === 'heading' ? 1.12 : 1.45)));
  return <Text {...rest} style={[{ fontFamily: family[weight], fontSize: size, lineHeight, color }, style]} />;
}

export const H = (p: TxtProps) => <Txt weight="heading" {...p} style={[{ letterSpacing: -0.015 * (p.size ?? 15) }, p.style]} />;

export const monoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });

// ─── Buttons ─────────────────────────────────────────────────────────────────

type BtnProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

/** Circular icon button (44px on surface by default). */
export function CircleButton({ size = 44, bg = colors.surface, style, children, ...rest }: BtnProps & { size?: number; bg?: string; children: ReactNode }) {
  return (
    <Pressable
      hitSlop={4}
      {...rest}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Solid terracotta pill, Caprasimo label. Hover/pressed step to accent-600/700. */
export function PrimaryButton({ label, height = 54, size = 17, style, disabledLook, ...rest }: BtnProps & { label: string; height?: number; size?: number; disabledLook?: boolean }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        s.pill, { height, backgroundColor: pressed ? colors.accent700 : hovered ? colors.accent600 : colors.accent, opacity: disabledLook ? 0.45 : 1 }, style,
      ]}
    >
      <H size={size} color={colors.bg} numberOfLines={1}>{label}</H>
    </Pressable>
  );
}

/** Outlined pill on transparent ground. */
export function OutlineButton({ label, height = 54, size = 17, style, ...rest }: BtnProps & { label: string; height?: number; size?: number }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [s.pill, { height, borderWidth: 1, borderColor: colors.divider, backgroundColor: pressed ? colors.neutral200 : 'transparent' }, style]}>
      <H size={size} numberOfLines={1}>{label}</H>
    </Pressable>
  );
}

/** Text-only link button (accent-700, semi-bold). */
export function LinkButton({ label, size = 14, weight = 'semi', color = colors.accent700, ...rest }: BtnProps & { label: string; size?: number; weight?: Weight; color?: string }) {
  return (
    <Pressable hitSlop={8} {...rest} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, rest.style as ViewStyle]}>
      <Txt size={size} weight={weight} color={color}>{label}</Txt>
    </Pressable>
  );
}

/** Selectable chip: ink fill when on, cream when off (the prototype's `pill(on)`). */
export function Chip({ label, on, onPress, left, height = 38 }: { label: string; on: boolean; onPress: () => void; left?: ReactNode; height?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.chip, { height, backgroundColor: on ? colors.text : colors.neutral100, opacity: pressed ? 0.8 : 1 }]}>
      {left}
      <Txt size={14} weight="semi" color={on ? colors.bg : colors.text}>{label}</Txt>
    </Pressable>
  );
}

/** Segmented control: surface track, active option lifted on neutral-100 with shadow-sm. */
export function Segmented<T extends string>({ options, value, onChange, height = 40, size = 14, style }: {
  options: [T, string][]; value: T; onChange: (v: T) => void; height?: number; size?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.segTrack, style]}>
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <Pressable key={v} onPress={() => onChange(v)} style={[s.segOpt, { height }, on && { backgroundColor: colors.neutral100, boxShadow: shadows.sm }]}>
            <Txt size={size} weight="semi" numberOfLines={1}>{l}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Tags & avatars ──────────────────────────────────────────────────────────

export function Tag({ label, bg, fg, size = 11, weight = 'bold', style }: { label: string; bg: string; fg: string; size?: number; weight?: Weight; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: bg }, style]}>
      <Txt size={size} weight={weight} color={fg} lh={1.25}>{label}</Txt>
    </View>
  );
}

export function Avatar({ init, size, bg = colors.accent2_300, font }: { init: string; size: number; bg?: string; font?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <H size={font ?? Math.round(size * 0.4)} lh={1}>{init}</H>
    </View>
  );
}

// ─── Photo placeholder ───────────────────────────────────────────────────────

/**
 * Striped stand-in for a photo: `repeating-linear-gradient(135deg, a 0 10px, b 10px 20px)`.
 * Swap for an <Image> inside a `.washed` treatment once real photos exist.
 */
export function Stripes({ tones, style, children, label, labelPos = { left: 12, bottom: 10 }, labelSize = 9 }: {
  tones: [string, string]; style?: StyleProp<ViewStyle>; children?: ReactNode;
  label?: string; labelPos?: { left: number; bottom: number }; labelSize?: number;
}) {
  const id = 'st' + useId().replace(/:/g, '');
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={20} height={20} patternTransform="rotate(45)">
            <Rect x={0} y={0} width={10} height={20} fill={tones[0]} />
            <Rect x={10} y={0} width={10} height={20} fill={tones[1]} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {label ? (
        <Text style={{ position: 'absolute', ...labelPos, fontFamily: monoFont, fontSize: labelSize, fontWeight: '500', color: colors.neutral700 }}>{label}</Text>
      ) : null}
      {children}
    </View>
  );
}

// ─── Layout bits ─────────────────────────────────────────────────────────────

export function Row({ style, children, gap, ...rest }: { style?: StyleProp<ViewStyle>; children: ReactNode; gap?: number }) {
  return <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Card({ style, children, bg = colors.surface, radius = 28, pad = 16 }: { style?: StyleProp<ViewStyle>; children: ReactNode; bg?: string; radius?: number; pad?: number }) {
  return <View style={[{ backgroundColor: bg, borderRadius: radius, padding: pad }, style]}>{children}</View>;
}

export const ellipsis: Partial<TextProps> = { numberOfLines: 1, ellipsizeMode: 'tail' };

export const textStyles = StyleSheet.create({
  muted: { color: colors.neutral700 } as TextStyle,
});

const s = StyleSheet.create({
  pill: { borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 999 },
  segTrack: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: colors.surface },
  segOpt: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
