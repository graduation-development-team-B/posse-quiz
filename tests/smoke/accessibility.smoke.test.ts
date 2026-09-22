import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(__dirname, '../..');
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('accessibility and responsive smoke checks', () => {
  it('gives shared controls semantic roles, labels, states, and 44pt hit targets', () => {
    const button = readProjectFile('components/AccessibleButton.tsx');
    const quizOption = readProjectFile('components/quiz/QuizOption.tsx');
    const tabs = readProjectFile('app/(tabs)/_layout.tsx');
    const roadmap = readProjectFile('components/roadmap/LearningRoadmapScreen.tsx');

    expect(button).toContain('accessibilityRole="button"');
    expect(button).toContain('accessibilityLabel={accessibilityLabel ?? label}');
    expect(button).toContain('accessibilityState={{ disabled: isDisabled, selected, expanded }}');
    expect(button).toMatch(/minHeight:\s*44/);
    expect(button).toMatch(/minWidth:\s*44/);

    expect(quizOption).toContain('accessibilityRole="radio"');
    expect(quizOption).toContain('accessibilityState={{ selected, disabled }}');
    expect(quizOption).toMatch(/minHeight:\s*52/);
    expect(tabs).toContain('name="home"');
    expect(tabs).toContain('options={{ href: null }}');
    expect(tabs).not.toContain("tabBarAccessibilityLabel: 'ホーム'");
    expect(tabs).toContain("tabBarAccessibilityLabel: 'ミニドリル'");
    expect(tabs).toContain("tabBarAccessibilityLabel: '学習'");
    expect(tabs).toContain("tabBarAccessibilityLabel: 'マイページ'");
    expect(roadmap).toContain('<StudyWeekCard days={studyWeek} studiedDays={studiedDays} />');
    expect(roadmap.indexOf('<StudyWeekCard')).toBeLessThan(roadmap.indexOf('<View style={[styles.summary'));
  });

  it('keeps native-web semantic activation without adding a custom focus ring', () => {
    const focus = readProjectFile('hooks/use-accessibility-focus.ts');
    const button = readProjectFile('components/AccessibleButton.tsx');
    const quizOption = readProjectFile('components/quiz/QuizOption.tsx');

    expect(button).toContain('Pressable');
    expect(quizOption).toContain('Pressable');
    expect(focus).toContain('onFocus');
    expect(focus).toContain('onBlur');
    expect(focus).toContain('const focusStyle: StyleProp<ViewStyle> = undefined;');
    expect(focus).not.toContain('outlineWidth');
    expect(focus).toContain('Pressable/TextInput still provide Enter/Space activation on web');
  });

  it('supports dark-mode palette switching and one live-region feedback announcement', () => {
    const theme = readProjectFile('constants/theme.ts');
    const colorScheme = readProjectFile('hooks/use-color-scheme.web.ts');
    const announcement = readProjectFile('components/accessibility/AccessibilityAnnouncement.tsx');
    const feedback = readProjectFile('app/feedback/[sessionId].tsx');

    expect(theme).toContain('light:');
    expect(theme).toContain('dark:');
    expect(colorScheme).toContain('useRNColorScheme');
    expect(colorScheme).toContain('hasHydrated');
    expect(announcement).toContain('accessibilityLiveRegion="polite"');
    expect(announcement).toContain('announcedAnnouncementKeys');
    expect(feedback).toContain('<AccessibilityAnnouncement');
    expect(feedback).toContain('announcementKey={answerKey}');
  });

  it('keeps major quiz states exposed to assistive technology', () => {
    const quiz = readProjectFile('app/quiz/[sessionId].tsx');
    const feedback = readProjectFile('app/feedback/[sessionId].tsx');
    const feedbackActions = readProjectFile('components/feedback/FeedbackActions.tsx');

    expect(quiz).toContain('accessibilityRole="radiogroup"');
    expect(quiz).toContain('accessibilityLiveRegion="polite"');
    expect(quiz).toContain('label="解答を確定"');
    expect(feedback).toContain('<FeedbackActions');
    expect(feedbackActions).not.toContain('復習に追加');
    expect(feedbackActions).toContain("label={isLastQuestion ? '結果を見る' : '次の問題へ'}");
  });
});
