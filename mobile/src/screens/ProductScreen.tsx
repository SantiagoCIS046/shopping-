import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { TryOnCanvas } from '../components/TryOnCanvas';
import { colors, radius, spacing } from '../shop/tokens';
import { formatCOP, Product, products } from '../data/products';
import { useCart } from '../context/CartContext';

type Props = {
  product: Product;
  onBack: () => void;
  onOpenCart: () => void;
};

export function ProductScreen({ product, onBack, onOpenCart }: Props) {
  const [size, setSize] = useState<string>(product.sizes[1] ?? product.sizes[0]);
  const [garment, setGarment] = useState<Product>(product);
  const { add } = useCart();
  const related = products.filter((p) => p.category === product.category).slice(0, 6);

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={60} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TryOnCanvas product={garment} />

          <View style={styles.row}>
            <Text style={styles.caption}>Módulo Vista: pruébatela sobre tu foto</Text>
            <Text style={styles.price}>{formatCOP(product.price)}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.garmentRow}>
            {related.map((p) => {
              const selected = p.id === garment.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Probar ${p.name}`}
                  onPress={() => setGarment(p)}
                  style={[styles.garmentChip, selected && styles.garmentChipActive]}
                >
                  <Text style={[styles.garmentChipText, selected && styles.garmentChipTextActive]}>
                    {p.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <GlassCard>
            <Text style={styles.sectionLabel}>Talla</Text>
            <View style={styles.sizes}>
              {product.sizes.map((s) => {
                const selected = s === size;
                return (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSize(s)}
                    style={[styles.size, selected && styles.sizeActive]}
                  >
                    <Text style={[styles.sizeText, selected && styles.sizeTextActive]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title="Agregar al carrito"
            onPress={() => add({ productId: product.id, name: product.name, price: product.price, size })}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              add({ productId: product.id, name: product.name, price: product.price, size });
              onOpenCart();
            }}
            style={styles.buyNow}
          >
            <Text style={styles.buyNowText}>Comprar ahora</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  topTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },
  spacer: { width: 60 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 24, gap: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  caption: { color: colors.textMuted, fontSize: 13 },
  price: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
  garmentRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.xl },
  garmentChip: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  garmentChipText: { color: colors.textSecondary, fontSize: 12 },
  garmentChipTextActive: { color: colors.textPrimary, fontWeight: '600' },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: spacing.sm },
  sizes: { flexDirection: 'row', gap: spacing.sm },
  size: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeActive: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  sizeText: { color: colors.textSecondary, fontSize: 14 },
  sizeTextActive: { color: colors.textPrimary, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm },
  buyNow: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
