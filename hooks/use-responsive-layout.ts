import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { getResponsiveLayoutMetrics, type ResponsiveLayoutMetrics } from '@/styles/responsive';

/**
 * React Native's window-dimension hook updates styles on viewport changes
 * without remounting the screen or its children. This keeps draft answers and
 * selections owned by their existing context/component state.
 */
export function useResponsiveLayout(): ResponsiveLayoutMetrics {
  const { width } = useWindowDimensions();

  return useMemo(() => getResponsiveLayoutMetrics(width), [width]);
}
