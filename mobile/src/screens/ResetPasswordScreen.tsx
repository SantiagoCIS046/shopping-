import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { SecureGlassInput } from '../components/SecureGlassInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { api } from '../api/client';
import { colors } from '../theme';

/**
 * Pantalla que abre el enlace del correo (tiendaropa://reset-password?token=...)
 * para registrar la contraseña nueva. El token llega por el deep link;
 * si no llegó, se puede pegar a mano.
 */
export function ResetPasswordScreen({
  route,
}: {
  route: RouteProp<RootStackParamList, 'ResetPassword'>;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!token.trim()) {
      setError('Falta el token del enlace; ábrelo desde tu correo');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password.length > 64) {
      setError('La contraseña no puede superar 64 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setBusy(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token: token.trim(), password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar la contraseña');
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
            <Text style={styles.title}>Nueva contraseña</Text>

            {done ? (
              <>
                <Text style={styles.body}>
                  ¡Lista! Tu contraseña nueva quedó guardada. Inicia sesión con ella.
                </Text>
                <PrimaryButton
                  title="Iniciar sesión"
                  onPress={() => navigation.replace('Login')}
                />
              </>
            ) : (
              <>
                <Text style={styles.body}>
                  Crea la contraseña nueva de tu cuenta. Quedará guardada de forma
                  segura y podrás iniciar sesión con ella.
                </Text>

                {!route.params?.token ? (
                  <GlassInput
                    value={token}
                    onChangeText={setToken}
                    placeholder="Token del correo"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.field}
                  />
                ) : null}

                <SecureGlassInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nueva contraseña"
                  textContentType="newPassword"
                  style={styles.field}
                />
                <SecureGlassInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirmar contraseña"
                  textContentType="newPassword"
                  style={styles.fieldLast}
                  onSubmitEditing={submit}
                  returnKeyType="done"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <PrimaryButton title="Guardar contraseña" onPress={submit} loading={busy} />
              </>
            )}
          </GlassCard>
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
    marginBottom: 14,
  },
  fieldLast: {
    marginBottom: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 13.5,
    marginBottom: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
