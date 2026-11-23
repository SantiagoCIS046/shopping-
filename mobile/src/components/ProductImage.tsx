import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { categoryIcon, categoryLabel, Product } from '../data/products';

// Degradados azul/gris por categoría (misma paleta de la app, tono claro)
const GRADIENTS: Record<string, [string, string]> = {
  camisetas: ['#24365C', '#16254A'],
  polos: ['#2A3C66', '#1C2E52'],
  oversize: ['#264270', '#18294E'],
  'camisas-vestir': ['#32437C', '#20305A'],
  deportiva: ['#244B6E', '#16304E'],
  buzos: ['#2E3A64', '#1B2544'],
  sudaderas: ['#293E6A', '#172749'],
  jeans: ['#354873', '#1F2F53'],
  zapatos: ['#3A4B75', '#203155'],
  gafas: ['#2B3964', '#182545'],
  relojes: ['#3C496F', '#232F4F'],
  lociones: ['#2D4472', '#172850'],
};
const FALLBACK: [string, string] = ['#2A3C66', '#1C2E52'];

/**
 * Imagen de un producto: si tiene URL muestra la foto real;
 * si no, una plantilla elegante con el ícono y nombre de su categoría.
 */
export function ProductImage({
  product,
  style,
  iconSize = 40,
}: {
  product: Product;
  style?: ViewStyle;
  iconSize?: number;
}) {
  if (product.image) {
    return <Image source={{ uri: product.image }} style={style as ImageStyle} contentFit="cover" transition={250} />;
  }
  const gradient = GRADIENTS[product.category] ?? FALLBACK;
  return (
    <View style={[styles.tile, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={categoryIcon(product.category)} size={iconSize} color="rgba(230, 236, 246, 0.95)" />
      <Text style={styles.label}>{categoryLabel(product.category)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  label: {
    color: 'rgba(230, 236, 246, 0.88)',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
