import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { StudyDay } from '@/lib/progress/roadmap';

interface StudyWeekCardProps {
  /** 直近7日分（当日が最後尾）の学習状況。 */
  days: readonly StudyDay[];
  studiedDays: number;
}

/**
 * 直近7日間の学習日をカレンダー風に見せるカード。
 * Progress_Snapshot には日別履歴がないため、各教材の最終回答日を学習日として扱う。
 */
export function StudyWeekCard({ days, studiedDays }: StudyWeekCardProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryTextColor = useThemeColor({}, 'primaryText');
  const trackColor = useThemeColor({}, 'disabledBackground');
  const isPerfectWeek = studiedDays >= days.length && days.length > 0;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`今週の学習記録。直近${days.length}日間で${studiedDays}日学習しました`}
      style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}
    >
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <ThemedText type="defaultSemiBold" style={styles.label}>今週の学習記録</ThemedText>
          <View style={styles.countRow}>
            <ThemedText style={[styles.count, { color: primaryColor }]}>{studiedDays}</ThemedText>
            <ThemedText style={styles.unit}>/{days.length}日</ThemedText>
          </View>
        </View>
        <View style={styles.daysRow}>
          {days.map((day) => (
            <View key={day.dateKey} style={styles.dayColumn}>
              <ThemedText style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                {day.dayLabel}
              </ThemedText>
              <View
                accessibilityRole="text"
                accessibilityLabel={`${day.dayLabel}曜日、${day.studied ? '学習済み' : '記録なし'}`}
                style={[
                  styles.dayMark,
                  { borderColor: day.studied ? primaryColor : trackColor },
                  day.studied && { backgroundColor: primaryColor },
                  day.isToday && !day.studied && { borderColor: primaryColor },
                ]}
              >
                <ThemedText
                  style={[styles.dayMarkText, { color: day.studied ? primaryTextColor : trackColor }]}
                >
                  {day.studied ? '✓' : '·'}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
        <ThemedText
          accessibilityLabel={isPerfectWeek ? '今週の目標を達成しました' : '7日学習でごほうび'}
          style={[styles.gift, !isPerfectWeek && styles.giftPending]}
        >
          🎁
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  heading: {
    gap: 2,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  countRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  count: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  unit: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.75,
  },
  daysRow: {
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.7,
  },
  dayLabelToday: {
    fontWeight: '800',
    opacity: 1,
  },
  dayMark: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  dayMarkText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  gift: {
    fontSize: 26,
    lineHeight: 30,
  },
  giftPending: {
    opacity: 0.45,
  },
});
