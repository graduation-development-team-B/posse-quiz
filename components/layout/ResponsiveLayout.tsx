import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getResponsiveContentStyle } from '@/styles/responsive';

export interface ResponsiveContainerProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * A full-screen container with a centered, breakpoint-aware content column.
 * The component stays mounted while its style changes, so child-local state is
 * preserved during viewport resizing.
 */
export function ResponsiveContainer({ children, style, contentStyle }: ResponsiveContainerProps) {
  const { width } = useResponsiveLayout();

  return (
    <View style={[styles.container, style]}>
      <View style={[getResponsiveContentStyle(width), contentStyle]}>{children}</View>
    </View>
  );
}

export interface ResponsiveScrollViewProps extends ScrollViewProps {
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Scrollable counterpart used by screens whose content can exceed the viewport.
 * It deliberately does not assign a React key or conditionally render children
 * at breakpoints, which keeps in-progress input state intact on resize.
 */
export function ResponsiveScrollView({
  children,
  contentContainerStyle,
  style,
  ...props
}: ResponsiveScrollViewProps) {
  const { width } = useResponsiveLayout();

  return (
    <ScrollView
      {...props}
      style={[styles.scrollView, style]}
      contentContainerStyle={[styles.scrollContent, getResponsiveContentStyle(width), contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
