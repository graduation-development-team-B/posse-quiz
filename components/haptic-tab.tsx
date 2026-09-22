import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';

export function HapticTab(props: BottomTabBarButtonProps) {
  const focus = useAccessibilityFocus();

  return (
    <PlatformPressable
      {...props}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      style={[props.style, focus.focusStyle]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
