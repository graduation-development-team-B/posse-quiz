import { useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ResponsiveScrollView } from '@/components/layout';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getResponsiveContentStyle } from '@/styles/responsive';

interface ScopeSheetProps {
  children: ReactNode;
  footer: ReactNode;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Responsive sheet shell: bottom-aligned on phones and centered on larger screens. */
export function ScopeSheet({ children, footer, onDismiss, style }: ScopeSheetProps) {
  const { width, isCompact } = useResponsiveLayout();
  const { height } = useWindowDimensions();
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const supportColor = useThemeColor({}, 'supportGray');
  const dismissTriggered = useRef(false);
  const scrollStartOffset = useRef(0);
  const scrollOffset = useRef(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    if (dismissTriggered.current || !onDismiss) return;
    dismissTriggered.current = true;
    Animated.timing(translateY, {
      duration: 220,
      toValue: Math.max(height, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [height, onDismiss, translateY]);

  const snapBack = useCallback(() => {
    Animated.timing(translateY, {
      duration: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffset.current = offsetY;
    if (offsetY < -56) dismiss();
  }, [dismiss]);

  const handleScrollBeginDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollStartOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    if (scrollStartOffset.current <= 0 && velocityY > 0.8) dismiss();
  }, [dismiss]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Boolean(onDismiss)
      && scrollOffset.current <= 0
      && gestureState.dy > 12
      && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 120 || gestureState.vy > 1) {
        dismiss();
      } else {
        snapBack();
      }
    },
    onPanResponderTerminate: snapBack,
  }), [dismiss, onDismiss, snapBack, translateY]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.backdrop, { backgroundColor }, isCompact ? styles.compactBackdrop : styles.wideBackdrop]}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheet,
            { backgroundColor: surfaceColor, borderColor, transform: [{ translateY }] },
            isCompact ? styles.compactSheet : styles.wideSheet,
            style,
          ]}
        >
          <View style={styles.handleHitArea}>
            <View style={[styles.handle, { backgroundColor: supportColor }]} accessibilityElementsHidden accessibilityLabel="学習設定シート" />
          </View>
          <ResponsiveScrollView
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ResponsiveScrollView>
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <View style={getResponsiveContentStyle(width)}>{footer}</View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  compactBackdrop: {
    justifyContent: 'flex-end',
  },
  wideBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  compactSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '96%',
  },
  wideSheet: {
    borderRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    maxWidth: 960,
  },
  handleHitArea: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: 72,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 4,
    width: 44,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  footer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingBottom: 12,
    paddingTop: 10,
  },
});
