import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
};

// Panel con efecto vidrio: blur real en iOS y Android, borde fino y relleno translúcido.
export function GlassCard({ children, intensity = 30, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  inner: {
    padding: 16,
  },
});
