import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme';

/**
 * Pantalla principal tras iniciar sesión: perfil del usuario,
 * acceso a la tienda y cierre de sesión.
 */
export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold });

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';
  const firstName = user?.name?.trim().split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      <AuthBackdrop intensity={60} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Bienvenido de nuevo</Text>
        {fontsLoaded ? <Text style={styles.heading}>Hola, {firstName}</Text> : null}

        <GlassCard style={styles.profile}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.name ?? ''}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.section}>Tu tienda</Text>

        <GlassCard>
          <PrimaryButton title="Explorar productos" onPress={() => navigation.navigate('Tienda')} />

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mis pedidos</Text>
            <Text style={styles.rowHint}>Míralos en tu perfil</Text>
          </View>
        </GlassCard>
      </ScrollView>
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
    paddingHorizontal: 22,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: 6,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 30,
    color: colors.text,
  },
  profile: {
    marginTop: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(109, 157, 243, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(109, 157, 243, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '600',
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  email: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 2,
  },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: colors.text,
  },
  rowHint: {
    fontSize: 12,
    color: colors.textFaint,
  },
});
