import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, G, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/tokens';

// Fondo urbano: degradado negro-azulado, cuadrícula sutil y siluetas de edificios.
export function UrbanBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[colors.bgDeep, colors.bg, colors.bgElevated]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" style={styles.city}>
        <Rect x="0" y="650" width="34" height="194" fill="#0B1733" />
        <Rect x="40" y="610" width="48" height="234" fill="#0E1E40" />
        <Rect x="130" y="580" width="56" height="264" fill="#102347" />
        <Rect x="238" y="560" width="44" height="284" fill="#0E1E40" />
        <Rect x="346" y="600" width="44" height="244" fill="#102347" />
        <G fill={colors.accent} opacity={0.5}>
          <Circle cx="150" cy="620" r="2" />
          <Circle cx="262" cy="600" r="2" />
          <Circle cx="50" cy="660" r="2" />
          <Circle cx="300" cy="680" r="2" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  city: {
    position: 'absolute',
    bottom: 0,
    opacity: 0.55,
  },
});
