import type { ViewStyle } from 'react-native';

export const RESPONSIVE_BREAKPOINTS = {
  compactMaxWidth: 767,
  mediumMaxWidth: 1023,
  contentMaxWidth: 960,
} as const;

export type ResponsiveBreakpoint = 'compact' | 'medium' | 'wide';

export interface ResponsiveLayoutMetrics {
  width: number;
  breakpoint: ResponsiveBreakpoint;
  isCompact: boolean;
  isMedium: boolean;
  isWide: boolean;
  horizontalPadding: number;
  contentMaxWidth: number;
}

export function getResponsiveBreakpoint(width: number): ResponsiveBreakpoint {
  if (width <= RESPONSIVE_BREAKPOINTS.compactMaxWidth) return 'compact';
  if (width <= RESPONSIVE_BREAKPOINTS.mediumMaxWidth) return 'medium';
  return 'wide';
}

export function getResponsiveHorizontalPadding(breakpoint: ResponsiveBreakpoint): number {
  switch (breakpoint) {
    case 'compact':
      return 16;
    case 'medium':
      return 24;
    case 'wide':
      return 32;
  }
}

export function getResponsiveLayoutMetrics(width: number): ResponsiveLayoutMetrics {
  const breakpoint = getResponsiveBreakpoint(width);

  return {
    width,
    breakpoint,
    isCompact: breakpoint === 'compact',
    isMedium: breakpoint === 'medium',
    isWide: breakpoint === 'wide',
    horizontalPadding: getResponsiveHorizontalPadding(breakpoint),
    contentMaxWidth: RESPONSIVE_BREAKPOINTS.contentMaxWidth,
  };
}

/**
 * Shared page-content sizing. The outer scroll view remains full width while
 * this content is centered at desktop widths and padded at every breakpoint.
 */
export function getResponsiveContentStyle(width: number): ViewStyle {
  const metrics = getResponsiveLayoutMetrics(width);

  return {
    alignSelf: 'center',
    maxWidth: metrics.contentMaxWidth,
    paddingHorizontal: metrics.horizontalPadding,
    width: '100%',
  };
}
