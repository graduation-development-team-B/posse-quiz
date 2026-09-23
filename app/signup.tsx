import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';
import { Mascot } from '@/components/game/Mascot';
import { ResponsiveContainer } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

/** メールアドレスとパスワードを入力する新規登録画面。登録処理は次の段階で接続する。 */
export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const primaryColor = useThemeColor({}, 'primary');
  const pageColor = useThemeColor({}, 'pageSurface');

  return (
    <ThemedView colorName="pageSurface" style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ResponsiveContainer contentStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.talkRow}>
              <Mascot mood="fun" size={88} />
              <View style={[styles.speechBubble, { backgroundColor: surfaceColor, borderColor }]}>
                <ThemedText style={styles.title} accessibilityRole="header">
                  アカウントを作成
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>アカウントを作ってミニドリルをはじめよう！</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>メールアドレス</ThemedText>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                accessibilityLabel="メールアドレス"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={mutedTextColor}
                returnKeyType="next"
                style={[styles.input, { borderColor, color: textColor, backgroundColor: pageColor }]}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <PasswordField
              label="パスワード"
              value={password}
              onChangeText={setPassword}
              visible={isPasswordVisible}
              onToggleVisibility={() => setIsPasswordVisible((visible) => !visible)}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
              borderColor={borderColor}
              pageColor={pageColor}
              primaryColor={primaryColor}
              placeholder="8文字以上のパスワード"
            />

            <PasswordField
              label="パスワード（確認）"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              visible={isConfirmationVisible}
              onToggleVisibility={() => setIsConfirmationVisible((visible) => !visible)}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
              borderColor={borderColor}
              pageColor={pageColor}
              primaryColor={primaryColor}
              placeholder="パスワードをもう一度入力"
            />

            <AccessibleButton
              accessibilityHint="入力した情報でアカウントを作成します"
              label="登録する"
              onPress={() => undefined}
              style={styles.signupButton}
            />

            <ThemedText style={[styles.helperText, { color: mutedTextColor }]}>新規登録機能は現在準備中です。</ThemedText>
          </View>

          <AccessibleButton
            label="ログイン画面へ戻る"
            onPress={() => router.replace('/login')}
            style={styles.backButton}
            variant="ghost"
          />
        </ResponsiveContainer>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  pageColor: string;
  primaryColor: string;
  placeholder: string;
};

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisibility,
  textColor,
  mutedTextColor,
  borderColor,
  pageColor,
  primaryColor,
  placeholder,
}: PasswordFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.passwordRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={mutedTextColor}
          secureTextEntry={!visible}
          style={[styles.input, styles.passwordInput, { borderColor, color: textColor, backgroundColor: pageColor }]}
          textContentType="newPassword"
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? `${label}を隠す` : `${label}を表示`}
          accessibilityRole="button"
          accessibilityState={{ selected: visible }}
          hitSlop={8}
          onPress={onToggleVisibility}
          style={styles.visibilityButton}
        >
          <ThemedText style={[styles.visibilityText, { color: primaryColor }]}>
            {visible ? '隠す' : '表示'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    alignSelf: 'center',
    justifyContent: 'center',
    maxWidth: 460,
    paddingHorizontal: 20,
    paddingVertical: 40,
    width: '100%',
  },
  header: { marginBottom: 24 },
  talkRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  speechBubble: { borderRadius: 12, borderWidth: 1, flex: 1, gap: 6, padding: 14 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 29 },
  subtitle: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  card: { borderRadius: 12, borderWidth: 1, gap: 20, padding: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', lineHeight: 21 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12 },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 66 },
  visibilityButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 52, position: 'absolute', right: 4, top: 4 },
  visibilityText: { fontSize: 13, fontWeight: '700' },
  signupButton: { marginTop: 0, minHeight: 52 },
  helperText: { fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  backButton: { alignSelf: 'center', marginTop: 12 },
});
