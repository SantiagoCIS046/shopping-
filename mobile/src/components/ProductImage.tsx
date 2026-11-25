import React, { useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { categoryIcon, categoryLabel, Product, PRODUCT_LOCAL_IMAGES } from '../data/products';
import { API_URL } from '../config';

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
 * Imagen de un producto:
 * 1. Prioriza la imagen local en assets (1024x1024 px ajustada sobre fondo blanco puro).
 * 2. Si no existe, intenta cargar la URL del servidor (/uploads/... o http://...).
 * 3. Si no hay imagen o falla, muestra la plantilla elegante con gradiente e ícono.
 */
export function ProductImage({
  product,
  style,
  iconSize = 40,
  contentFit = 'cover',
}: {
  product: Product;
  style?: ViewStyle;
  iconSize?: number;
  contentFit?: 'cover' | 'contain';
}) {
  const [hasError, setHasError] = useState(false);

  // 1. Asset local directo (0 latencia, offline garantizado)
  const localAsset = PRODUCT_LOCAL_IMAGES[product.id];

  // 2. URI remota o servida por backend
  const resolveUri = () => {
    if (!product.image || hasError) return null;
    if (product.image.startsWith('http')) return product.image;
    const cleanPath = product.image.startsWith('/') ? product.image : `/${product.image}`;
    return `${API_URL}${cleanPath}`;
  };

  const remoteUri = resolveUri();
  const source = localAsset ?? (remoteUri ? { uri: remoteUri } : null);

  if (source && !hasError) {
    return (
      <Image
        source={source}
        style={style as ImageStyle}
        contentFit={contentFit}
        transition={150}
        cachePolicy="memory-disk"
        onError={() => setHasError(true)}
      />
    );
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
