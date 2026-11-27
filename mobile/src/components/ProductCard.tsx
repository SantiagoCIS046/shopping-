import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCOP, Product } from '../data/products';
import { colors, fonts, radius, spacing } from '../shop/tokens';
import { ProductImage } from './ProductImage';

type Props = {
  product: Product;
  width?: number;
  onOpen: (product: Product) => void;
  onAddToCart: (product: Product) => void;
};

/** Tarjeta de producto: plantilla/imagen, nombre, precio y tallas. */
export function ProductCard({ product, width, onOpen, onAddToCart }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${product.name}`}
      onPress={() => onOpen(product)}
      style={[styles.card, width != null && { width }]}
    >
      <View style={styles.imageWrap}>
        {/* Foto 1:1 sobre blanco, imagen completa con ~8 % de margen interior */}
        <ProductImage product={product} style={styles.image} iconSize={34} contentFit="contain" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Agregar ${product.name} al carrito`}
          onPress={() => onAddToCart(product)}
          hitSlop={8}
          style={styles.add}
        >
          <Ionicons name="add" size={20} color={colors.textOnAccent} />
        </Pressable>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCOP(product.price)}</Text>
        <Text style={styles.sizes} numberOfLines={1}>
          Tallas {product.sizes.join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '84%',
    height: '84%',
    alignSelf: 'center',
    marginTop: '8%',
  },
  info: {
    paddingHorizontal: 4,
  },
  add: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    marginTop: spacing.sm + 2,
  },
  price: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginTop: 2,
  },
  sizes: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
} as const);
