import { Platform } from 'react-native';

/**
 * Semantic colors shared by every screen. The light and dark palettes keep
 * normal text above the WCAG AA contrast target on their matching surfaces.
 */
export const Colors = {
  light: {
    // SKILLS.md フレイム・パレット。text/背景は約13.6:1でWCAG AAAをクリア。
    text: '#3B2314',
    textSecondary: '#6B4423',
    background: '#FDF8F4',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    tint: '#FF4500',
    primary: '#FF4500',
    primaryText: '#FFFFFF',
    border: '#F0C9A0',
    icon: '#6B4423',
    tabIconDefault: '#9A6B45',
    tabIconSelected: '#FF4500',
    link: '#C2360B',
    focus: '#FF4500',
    selectedBackground: '#FFE8D5',
    selectedBorder: '#FF4500',
    disabledBackground: '#EAD9C8',
    disabledText: '#6B4423',
    success: '#15803D',
    successBackground: '#E4F6E9',
    review: '#1D4ED8',
    reviewBackground: '#EFF6FF',
    growth: '#15803D',
    error: '#B91C1C',
    codeBackground: '#FBE6D2',
    progressOrange: '#FF4500',
    reviewBlue: '#1D4ED8',
    growthGreen: '#15803D',
    supportGray: '#6B4423',
    surfaceWhite: '#FFFFFF',
    pageSurface: '#FDF8F4',
    reviewSurface: '#EAF3FF',
    achievementSurface: '#FFEFD6',
    controlSurface: '#FBE6D2',
    shadow: '#3B2314',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#243447',
    tint: '#FDBA74',
    primary: '#FDBA74',
    primaryText: '#431407',
    border: '#475569',
    icon: '#CBD5E1',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FDBA74',
    link: '#FDBA74',
    focus: '#FBBF24',
    selectedBackground: '#431407',
    selectedBorder: '#FDBA74',
    disabledBackground: '#334155',
    disabledText: '#CBD5E1',
    success: '#86EFAC',
    successBackground: '#431407',
    review: '#93C5FD',
    reviewBackground: '#172554',
    growth: '#86EFAC',
    error: '#FDA4AF',
    codeBackground: '#111827',
    progressOrange: '#FDBA74',
    reviewBlue: '#93C5FD',
    growthGreen: '#86EFAC',
    supportGray: '#CBD5E1',
    surfaceWhite: '#243447',
    pageSurface: '#0F172A',
    reviewSurface: '#172554',
    achievementSurface: '#431407',
    controlSurface: '#334155',
    shadow: '#000000',
  },
};

export type ColorName = keyof (typeof Colors)['light'];
export type ColorScheme = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
