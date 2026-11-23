import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { api } from '../api/client';
import { colors } from '../theme';

/**
 * Recuperación de contraseña: se escribe el correo y el backend
 * envía un enlace para crear una contraseña nueva.
 */
export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar el correo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthBackdrop />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard>
            <Text style={styles.title}>Recuperar contraseña</Text>

            {sent ? (
              <>
                <Text style={styles.body}>
                  Si el correo está registrado, te llegó un enlace para crear una
                  contraseña nueva. Ábrelo desde tu celular — expira en 1 hora.
                </Text>
                <PrimaryButton
                  title="Volver a iniciar sesión"
                  onPress={() => navigation.replace('Login')}
                />
              </>
            ) : (
              <>
                <Text style={styles.body}>
                  Escribe el correo de tu cuenta y te enviaremos un enlace para
                  crear una contraseña nueva.
                </Text>
                <GlassInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo electrónico"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  style={styles.field}
                  onSubmitEditing={submit}
                  returnKeyType="send"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton title="Enviar enlace" onPress={submit} loading={busy} />
              </>
            )}
          </GlassCard>

          {!sent ? (
            <Pressable onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textDim,
    marginBottom: 18,
  },
  field: {
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 13.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  back: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  backText: {
    color: colors.textDim,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
