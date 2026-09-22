import type { ReactNode } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getLearningContainerStyle } from '@/styles/learning';

export type LearningSurfaceProps = Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'> &
  Pick<ViewProps, 'accessibilityLabel' | 'accessibilityRole' | 'testID'> & {
    children: ReactNode;
    /** Keep false for screens that provide their own scrolling region. */
    scrollable?: boolean;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    innerStyle?: StyleProp<ViewStyle>;
  };

/** Shared safe-area screen surface with a centered, overflow-safe content column. */
export function LearningSurface({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  innerStyle,
  accessibilityLabel,
  accessibilityRole,
  testID,
  ...scrollViewProps
}: LearningSurfaceProps) {
  const { width } = useResponsiveLayout();
  const backgroundColor = useThemeColor({}, 'background');
  const containerStyle = [getLearningContainerStyle(width), innerStyle];

  return (
    <SafeAreaView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[styles.surface, { backgroundColor }, style]}
      testID={testID}>
      {scrollable ? (
        <ScrollView
          {...scrollViewProps}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={containerStyle}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>
          <View style={containerStyle}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    overflow: 'hidden',
  },
  staticContent: {
    flex: 1,
    overflow: 'hidden',
  },
});
