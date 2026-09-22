import { useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Keeps focus event handlers available without adding a custom focus ring.
 * Pressable/TextInput still provide Enter/Space activation on web.
 */
export function useAccessibilityFocus() {
  const onFocus = useCallback(() => undefined, []);
  const onBlur = useCallback(() => undefined, []);
  const focusStyle: StyleProp<ViewStyle> = undefined;

  return { focused: false, onFocus, onBlur, focusStyle };
}
