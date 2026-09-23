import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ResponsiveScrollView } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AccountScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const borderColor = useThemeColor({}, 'border');

  function openSignOutConfirmation() {
    setSignOutError('');
    setIsConfirmVisible(true);
  }

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await signOut();
      if (error) {
        setSignOutError('ログアウトできませんでした。もう一度お試しください。');
        return;
      }
      setIsConfirmVisible(false);
      router.replace('/login');
    } catch {
      setSignOutError('ログアウトできませんでした。もう一度お試しください。');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ThemedView colorName="pageSurface" style={styles.screen}>
      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">マイページ</ThemedText>
        <ThemedText style={styles.description}>POSSE Quizの学習環境を整えます。</ThemedText>
        <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="subtitle">学習設定</ThemedText>
        <ThemedText style={styles.description}>問題数、教材の再取得、端末内の学習記録を管理できます。</ThemedText>
        <AccessibleButton label="設定を開く" onPress={() => router.push('/settings')} style={styles.cta} variant="secondary" />
      </ThemedView>
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="subtitle">アカウント</ThemedText>
        {session ? (
          <>
            <ThemedText style={styles.description}>{session.user.email ?? 'ログイン中のユーザー'}</ThemedText>
            <AccessibleButton label="ログアウト" onPress={openSignOutConfirmation} style={styles.cta} variant="secondary" />
          </>
        ) : (
          <>
            <ThemedText style={styles.description}>ログインすると、学習状況を引き継いで利用できます。</ThemedText>
            <AccessibleButton label="ログイン画面を開く" onPress={() => router.push('/login')} style={styles.cta} />
            <AccessibleButton label="新規登録画面を開く" onPress={() => router.push('/signup')} style={styles.cta} variant="secondary" />
          </>
        )}
      </ThemedView>
      </ResponsiveScrollView>
      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!isSigningOut) setIsConfirmVisible(false);
        }}
        transparent
        visible={isConfirmVisible}
      >
        <View style={styles.overlay}>
          <ThemedView variant="surface" style={[styles.dialog, { borderColor }]}>
            <ThemedText type="subtitle" accessibilityRole="header">本当にログアウトしますか？</ThemedText>
            <ThemedText style={styles.description}>ログアウト後も、再ログインするとアカウントを利用できます。</ThemedText>
            {signOutError ? (
              <ThemedText colorName="error" accessibilityLiveRegion="polite">{signOutError}</ThemedText>
            ) : null}
            <View style={styles.dialogActions}>
              <AccessibleButton
                label="キャンセル"
                disabled={isSigningOut}
                onPress={() => setIsConfirmVisible(false)}
                style={styles.dialogButton}
                variant="secondary"
              />
              <AccessibleButton
                label={isSigningOut ? 'ログアウト中…' : 'ログアウトする'}
                disabled={isSigningOut}
                onPress={handleSignOut}
                style={styles.dialogButton}
              />
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 20, paddingBottom: 112 },
  description: { lineHeight: 23, opacity: 0.76 },
  card: { borderRadius: 28, gap: 10, padding: 22 },
  cta: { alignSelf: 'flex-start', borderRadius: 999, marginHorizontal: 0 },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  dialogActions: { flexDirection: 'row', gap: 10 },
  dialogButton: { flex: 1 },
});
