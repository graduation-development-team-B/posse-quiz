import { View, type ViewProps } from 'react-native';

import type { ColorName } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  /** Select a semantic color token without scattering palette values in screens. */
  colorName?: ColorName;
  variant?: 'background' | 'surface' | 'elevated';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  colorName,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const variantColorName =
    variant === 'surface'
      ? 'surface'
      : variant === 'elevated'
        ? 'surfaceElevated'
        : 'background';
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorName ?? variantColorName,
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
