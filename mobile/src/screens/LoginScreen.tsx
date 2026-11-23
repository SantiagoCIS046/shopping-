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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { SecureGlassInput } from '../components/SecureGlassInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Mode = 'login' | 'register';

/**
 * Login / crear cuenta en una tarjeta glass sobre la foto de la tienda.
 * Ingresar por primera vez o crear usuario; recuperar contraseña abajo.
 */
export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold });

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedData, setAcceptedData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (mode === 'register' && name.trim().length < 2) {
      setError('Escribe tu nombre');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Escribe un correo válido');
      return;
    }
    if (mode === 'register') {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (password.length > 64) {
        setError('La contraseña no puede superar 64 caracteres');
        return;
      }
    } else if (password.length === 0) {
      setError('Escribe tu contraseña');
      return;
    }
    if (mode === 'register' && !acceptedData) {
      setError('Debes aceptar la política de tratamiento de datos para crear tu cuenta');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
      navigation.replace('Main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal, intenta de nuevo');
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
          <View style={styles.header}>
            {fontsLoaded ? (
              <Text style={styles.brandTitle}>Shopping</Text>
            ) : null}
            <Text style={styles.brandSub}>
              {mode === 'login' ? 'Nos alegra verte de vuelta' : 'Crea tu cuenta y empieza'}
            </Text>
          </View>

          <GlassCard>
            {/* Selector de modo */}
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleOption, mode === 'login' && styles.toggleActive]}
                onPress={() => switchMode('login')}
              >
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                  Ingresar
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleOption, mode === 'register' && styles.toggleActive]}
                onPress={() => switchMode('register')}
              >
                <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                  Crear cuenta
                </Text>
              </Pressable>
            </View>

            {mode === 'register' ? (
              <GlassInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre completo"
                autoCapitalize="words"
                textContentType="name"
                style={styles.field}
              />
            ) : null}

            <GlassInput
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.field}
            />

            <SecureGlassInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              style={mode === 'register' ? styles.field : styles.fieldLast}
              onSubmitEditing={submit}
              returnKeyType="done"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {mode === 'register' ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedData }}
                onPress={() => setAcceptedData((v) => !v)}
                style={styles.acceptRow}
              >
                <Ionicons
                  name={acceptedData ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={acceptedData ? colors.accent : colors.textFaint}
                />
                <Text style={styles.acceptText}>
                  Acepto la{' '}
                  <Text style={styles.acceptLink} onPress={() => navigation.navigate('Legal')}>
                    política de tratamiento de datos
                  </Text>{' '}
                  (Ley 1581)
                </Text>
              </Pressable>
            ) : null}

            <PrimaryButton
              title={mode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}
              onPress={submit}
              loading={busy}
            />
          </GlassCard>

          {mode === 'login' ? (
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  brandTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 34,
    color: colors.text,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 14,
    color: colors.textDim,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleOption: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(61, 123, 250, 0.24)',
  },
  toggleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textFaint,
  },
  toggleTextActive: {
    color: colors.accent,
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
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  acceptText: {
    color: colors.textDim,
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  acceptLink: { color: colors.accent, textDecorationLine: 'underline' },
  forgot: {
    alignSelf: 'center',
    marginTop: 22,
    padding: 8,
  },
  forgotText: {
    color: colors.textDim,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
