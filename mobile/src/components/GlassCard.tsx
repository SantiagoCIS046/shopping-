import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { fill } from '../theme';

/**
 * Panel estilo glass: blur real + tinte translúcido + borde fino claro.
 * `compact` reduce el relleno (paneles flotantes) y `light` usa un
 * tinte gris claro con texto oscuro pensado para overlays.
 */
export function GlassCard({
  children,
  style,
  compact,
  light,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <View style={[styles.outer, style]}>
      <BlurView intensity={light ? 30 : 30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, light && styles.overlayLight]} />
      <View style={[styles.content, compact && styles.contentCompact]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  overlay: {
    ...fill,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 26,
  },
  overlayLight: {
    backgroundColor: 'rgba(74, 84, 102, 0.50)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  content: {
    padding: 24,
  },
  contentCompact: {
    padding: 14,
  },
});
