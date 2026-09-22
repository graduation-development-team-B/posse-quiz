import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const announcedAnnouncementKeys = new Set<string>();

interface AccessibilityAnnouncementProps {
  message: string;
  announcementKey: string;
}

/**
 * Announces a feedback result once per result key. Keeping the visible result
 * separate prevents parent re-renders from repeating the live-region update.
 */
export function AccessibilityAnnouncement({
  message,
  announcementKey,
}: AccessibilityAnnouncementProps) {
  const lastKey = useRef<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState('');

  useEffect(() => {
    if (lastKey.current === announcementKey || announcedAnnouncementKeys.has(announcementKey)) return;
    lastKey.current = announcementKey;
    announcedAnnouncementKeys.add(announcementKey);
    setPendingMessage(message);
  }, [announcementKey, message]);

  return (
    <ThemedText
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={styles.announcement}
    >
      {pendingMessage}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  announcement: {
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    width: 1,
  },
});
