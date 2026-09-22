import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameActionButton } from '@/components/game/GameActionButton';
import { GameColors, Radii, Space } from '@/constants/game-theme';
import {
  absoluteTerminalPath,
  createTerminalStageState,
  runTerminalStageCommand,
  type TerminalStageState,
} from '@/lib/quiz/terminalToken';
import type { TerminalStage, TerminalToken } from '@/types/content';

interface TerminalTokenActivityProps {
  rootName: string;
  stage: TerminalStage;
  completed: boolean;
  onComplete: () => void;
}

export function TerminalTokenActivity({
  rootName,
  stage,
  completed,
  onComplete,
}: TerminalTokenActivityProps) {
  const [state, setState] = useState<TerminalStageState>(() => completed
    ? {
        ...createTerminalStageState(stage),
        completedCommandCount: stage.goal.commandSequence.length,
        isComplete: true,
      }
    : createTerminalStageState(stage));
  const [selected, setSelected] = useState<TerminalToken[]>([]);
  const selectedIds = useMemo(() => new Set(selected.map((token) => token.id)), [selected]);
  const isComplete = completed || state.isComplete;
  const currentStep = Math.min(
    state.completedCommandCount + (isComplete ? 0 : 1),
    stage.goal.commandSequence.length,
  );

  const handleRun = () => {
    if (selected.length === 0 || isComplete) return;
    const next = runTerminalStageCommand(stage, state, selected.map((token) => token.label));
    setState(next);
    setSelected([]);
    if (next.isComplete && !state.isComplete) onComplete();
  };

  const handleReset = () => {
    if (isComplete) return;
    setState(createTerminalStageState(stage));
    setSelected([]);
  };

  return (
    <View style={styles.card} accessibilityLabel="操作ミッション">
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>
            {stage.inputMode === 'pullRequest' ? 'PULL REQUEST 設定' : 'VIRTUAL TERMINAL'}
          </Text>
          <Text style={styles.mission}>{stage.mission}</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>
            {isComplete ? '完了' : `${currentStep}/${stage.goal.commandSequence.length}`}
          </Text>
        </View>
      </View>

      <View style={styles.pathBar}>
        <Text style={styles.pathLabel}>
          {stage.inputMode === 'pullRequest'
            ? 'Compare changes'
            : absoluteTerminalPath(rootName, state.cwd)}
        </Text>
      </View>

      <View style={styles.terminal} accessibilityLabel="実行履歴">
        {state.history.length === 0 ? (
          <Text style={styles.terminalMuted}>トークンを順番に選んで実行してください。</Text>
        ) : (
          state.history.map((entry, entryIndex) => (
            <View key={`${entry.command}-${entryIndex}`} style={styles.historyEntry}>
              <Text style={styles.commandLine}>
                <Text style={styles.promptMark}>
                  {stage.inputMode === 'pullRequest' ? 'PR ' : '$ '}
                </Text>
                {entry.command}
              </Text>
              {entry.lines.map((line, lineIndex) => (
                <Text
                  key={`${line}-${lineIndex}`}
                  style={entry.isError ? styles.errorLine : styles.outputLine}
                >
                  {line || '✓ 実行しました'}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>

      <View style={styles.answerBoard} accessibilityLabel="組み立て中の操作">
        <Text style={styles.answerPrompt}>
          {stage.inputMode === 'pullRequest' ? 'PR' : '$'}
        </Text>
        <View style={styles.selectedTokens}>
          {selected.length === 0 ? (
            <Text style={styles.placeholder}>ここに操作を組み立てます</Text>
          ) : (
            selected.map((token, index) => (
              <Pressable
                key={token.id}
                accessibilityRole="button"
                accessibilityLabel={`${token.label}を取り消す`}
                onPress={() => setSelected((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                style={styles.selectedToken}
              >
                <Text style={styles.selectedTokenText}>{token.label}</Text>
              </Pressable>
            ))
          )}
        </View>
      </View>

      <View style={styles.keyboard} accessibilityLabel="操作トークン">
        {stage.tokens.map((token) => {
          const disabled = isComplete || selectedIds.has(token.id);
          return (
            <Pressable
              key={token.id}
              accessibilityRole="button"
              accessibilityLabel={`${token.label}を選ぶ`}
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => setSelected((current) => [...current, token])}
              style={({ pressed }) => [
                styles.token,
                token.kind === 'command' && styles.commandToken,
                disabled && styles.tokenDisabled,
                pressed && !disabled && styles.tokenPressed,
              ]}
            >
              <Text style={[styles.tokenText, token.kind === 'command' && styles.commandTokenText]}>
                {token.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="操作を最初からやり直す"
          accessibilityState={{ disabled: isComplete }}
          disabled={isComplete}
          onPress={handleReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetText}>↺ やり直す</Text>
        </Pressable>
        <GameActionButton
          label={isComplete ? 'ミッション達成' : '実行する'}
          accessibilityHint="組み立てた操作を仮想環境で実行します"
          disabled={selected.length === 0 || isComplete}
          onPress={handleRun}
          style={styles.runButton}
          variant={isComplete ? 'success' : 'accent'}
        />
      </View>

      <View style={[styles.hint, isComplete && styles.success]} accessibilityLiveRegion="polite">
        <Text style={[styles.hintTitle, isComplete && styles.successText]}>
          {isComplete ? '✓ CLEAR' : 'ヒント'}
        </Text>
        <Text style={[styles.hintText, isComplete && styles.successText]}>
          {isComplete ? stage.successMessage : stage.hint}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GameColors.card,
    borderColor: GameColors.border,
    borderRadius: Radii.card,
    borderWidth: 2,
    gap: Space.md,
    padding: Space.lg,
  },
  headingRow: { flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' },
  headingCopy: { flex: 1, gap: Space.xs },
  eyebrow: { color: GameColors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  mission: { color: GameColors.text, fontSize: 17, fontWeight: '800', lineHeight: 25 },
  stepBadge: { backgroundColor: GameColors.primarySoft, borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  stepText: { color: GameColors.primaryEdge, fontSize: 12, fontWeight: '900' },
  pathBar: { backgroundColor: GameColors.neutral, borderRadius: Radii.chip, paddingHorizontal: 12, paddingVertical: 8 },
  pathLabel: { color: GameColors.subText, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' },
  terminal: { backgroundColor: GameColors.codeBg, borderRadius: Radii.chip, gap: Space.sm, minHeight: 112, padding: Space.md },
  terminalMuted: { color: '#D8BFA8', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  historyEntry: { gap: 3 },
  commandLine: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  promptMark: { color: '#FDBA74' },
  outputLine: { color: GameColors.codeText, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  errorLine: { color: '#FCA5A5', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  answerBoard: { alignItems: 'center', backgroundColor: GameColors.primarySoft, borderColor: GameColors.border, borderRadius: Radii.chip, borderWidth: 2, flexDirection: 'row', gap: Space.sm, minHeight: 54, padding: Space.sm },
  answerPrompt: { color: GameColors.primaryEdge, fontFamily: 'monospace', fontSize: 17, fontWeight: '900' },
  selectedTokens: { alignItems: 'center', flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  placeholder: { color: GameColors.disabledText, fontSize: 13, fontWeight: '600' },
  selectedToken: { backgroundColor: GameColors.card, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  selectedTokenText: { color: GameColors.text, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  token: { backgroundColor: GameColors.neutral, borderBottomColor: GameColors.neutralEdge, borderBottomWidth: 3, borderRadius: Radii.chip, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 10 },
  commandToken: { backgroundColor: GameColors.primary, borderBottomColor: GameColors.primaryEdge },
  tokenDisabled: { opacity: 0.35 },
  tokenPressed: { borderBottomWidth: 1, transform: [{ translateY: 2 }] },
  tokenText: { color: GameColors.text, flexShrink: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  commandTokenText: { color: GameColors.onPrimary },
  actions: { alignItems: 'stretch', flexDirection: 'row', gap: Space.sm },
  resetButton: { alignItems: 'center', backgroundColor: GameColors.neutral, borderBottomColor: GameColors.neutralEdge, borderBottomWidth: 3, borderRadius: Radii.chip, justifyContent: 'center', minHeight: 60, paddingHorizontal: 12 },
  resetPressed: { borderBottomWidth: 1, transform: [{ translateY: 2 }] },
  resetText: { color: GameColors.subText, fontSize: 13, fontWeight: '800' },
  runButton: { flex: 1 },
  hint: { backgroundColor: GameColors.accentSoft, borderRadius: Radii.chip, gap: 3, padding: Space.md },
  success: { backgroundColor: GameColors.successSoft },
  hintTitle: { color: GameColors.accentEdge, fontSize: 12, fontWeight: '900' },
  hintText: { color: GameColors.subText, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  successText: { color: GameColors.success },
});
