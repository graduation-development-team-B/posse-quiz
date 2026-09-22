import { describe, expect, it } from 'vitest';

import {
  getResponsiveBreakpoint,
  getResponsiveContentStyle,
  getResponsiveLayoutMetrics,
} from '@/styles/responsive';

describe('responsive layout breakpoints', () => {
  it.each([
    [320, 'compact'],
    [767, 'compact'],
    [768, 'medium'],
    [1023, 'medium'],
    [1024, 'wide'],
  ] as const)('classifies %dpx as %s', (width, expected) => {
    expect(getResponsiveBreakpoint(width)).toBe(expected);
  });

  it('uses compact padding for one-column mobile layouts', () => {
    expect(getResponsiveLayoutMetrics(767)).toMatchObject({
      breakpoint: 'compact',
      horizontalPadding: 16,
      isCompact: true,
    });
  });

  it('uses intermediate padding between mobile and desktop', () => {
    expect(getResponsiveLayoutMetrics(768)).toMatchObject({
      breakpoint: 'medium',
      horizontalPadding: 24,
      isMedium: true,
    });
  });

  it('centers wide content at a maximum width of 960px', () => {
    expect(getResponsiveContentStyle(1024)).toMatchObject({
      alignSelf: 'center',
      maxWidth: 960,
      width: '100%',
      paddingHorizontal: 32,
    });
  });
});
