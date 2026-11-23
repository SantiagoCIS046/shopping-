import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { INTRO_IMAGE, fill } from '../theme';

/**
 * Fondo compartido de la app: foto de la tienda desenfocada,
 * con un velo claro y suave para que se sienta la calidez del local
 * sin perder legibilidad sobre las tarjetas glass.
 */
export function AuthBackdrop({ intensity = 60 }: { intensity?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={INTRO_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Velo oscuro más liviano: más claro que antes */}
      <View style={styles.dim} />
      {/* Aire azulado claro que levanta el brillo del fondo */}
      <View style={styles.lightVeil} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...fill,
    backgroundColor: 'rgba(5, 10, 22, 0.18)',
  },
  lightVeil: {
    ...fill,
    backgroundColor: 'rgba(158, 180, 210, 0.16)',
  },
});
