import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCOP, Product } from '../data/products';
import { colors, radius, spacing } from '../shop/tokens';
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
        <ProductImage product={product} style={styles.image} iconSize={34} />
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
        <Text style={styles.name} numberOfLines={1}>
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
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 210,
  },
  info: {
    paddingHorizontal: 10,
  },
  add: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm + 2,
  },
  price: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  sizes: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
} as const);
