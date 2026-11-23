import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

/**
 * Pantalla de carga para quienes ya iniciaron sesión:
 * círculo con "Loading" al centro durante ~3 segundos y entra a la app.
 * El conteo arranca cuando `active` es true (al revelarse la intro).
 */
export function LoadingScreen({ active = true }: { active?: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 3000);
    return () => clearTimeout(timer);
  }, [active, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loading}>Loading</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(232,236,244,0.85)',
  },
});
