import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { IntroOverlay } from './IntroOverlay';
import { LoginScreen } from './LoginScreen';
import { LoadingScreen } from './LoadingScreen';
import { colors } from '../theme';

/**
 * Pantalla de entrada: la intro (overlay) está montada encima del contenido
 * real. Al hacer scroll hacia arriba, la intro se desvanece y revela lo que
 * hay detrás: el login si no hay sesión, o la pantalla de carga de 3s si ya
 * la hay (el conteo arranca justo al revelarse, no antes).
 */
export function WelcomeScreen() {
  const { user, restoring } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);

  // Si el scroll terminó antes de restaurar la sesión, espera a que termine
  useEffect(() => {
    if (pendingReveal && !restoring) {
      setPendingReveal(false);
      setRevealed(true);
    }
  }, [pendingReveal, restoring]);

  const handleReveal = () => {
    if (restoring) {
      setPendingReveal(true);
    } else {
      setRevealed(true);
    }
  };

  return (
    <View style={styles.container}>
      {restoring ? null : user ? (
        <LoadingScreen active={revealed} />
      ) : (
        <LoginScreen />
      )}

      {!revealed && <IntroOverlay onReveal={handleReveal} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
