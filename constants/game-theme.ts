/**
 * クイズ「ゲーム体験」用のデザイントークン。
 * ketanatsune-demo/my-app の学習ゲーム構造と SKILLS.md の配色に準拠する。
 */
export const GameColors = {
  bg: '#FDF8F4',
  card: '#FFFFFF',
  border: '#F0C9A0',
  text: '#3B2314',
  subText: '#6B4423',

  primary: '#FF4500',
  primaryEdge: '#C2360B',
  primarySoft: '#FFE8D5',
  onPrimary: '#FFFFFF',

  accent: '#FF8C00',
  accentEdge: '#C46A00',
  accentSoft: '#FFEFD6',

  neutral: '#FBE6D2',
  neutralEdge: '#E9C4A0',

  success: '#15803D',
  successEdge: '#0F5C2C',
  successSoft: '#E4F6E9',

  danger: '#B91C1C',
  dangerEdge: '#8E1414',
  dangerSoft: '#FBE4E4',

  disabled: '#EAD9C8',
  disabledEdge: '#D3BBA3',
  disabledText: '#9A8676',

  codeBg: '#3B2314',
  codeText: '#FFEFD6',
} as const;

export const Radii = {
  chip: 12,
  card: 16,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const TokenSize = {
  large: 56,
  small: 44,
} as const;

export const BUTTON_EDGE = 4;
export const MOTION_MS = 300;

export type GameTone = 'primary' | 'accent' | 'success' | 'danger' | 'ghost';
