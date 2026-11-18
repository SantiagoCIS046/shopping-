import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UrbanBackground } from '../components/UrbanBackground';
import { GlassCard } from '../components/GlassCard';
import { TryOnCanvas } from '../components/TryOnCanvas';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing } from '../theme/tokens';
import { formatCOP, Product, products } from '../data/products';
import { useCart } from '../context/CartContext';

type Props = {
  product: Product;
  onBack: () => void;
};

export function ProductScreen({ product, onBack }: Props) {
  const [size, setSize] = useState<Product['sizes'][number]>(product.sizes[1] ?? product.sizes[0]);
  const [garment, setGarment] = useState<Product>(product);
  const { add } = useCart();

  return (
    <View style={styles.root}>
      <UrbanBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <PrimaryButton label="Volver" variant="ghost" onPress={onBack} style={styles.back} />
          <Text style={styles.topTitle} numberOfLines={1}>{product.name}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TryOnCanvas garmentUri={garment.image} />

          <View style={styles.row}>
            <Text style={styles.caption}>Cambia la prenda con la que te pruebas</Text>
            <Text style={styles.price}>{formatCOP(product.price)}</Text>
          </View>

          <View style={styles.garmentRow}>
            {products.map((p) => {
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
                  <Text style={[styles.garmentChipText, selected && { color: colors.textPrimary }]}>
                    {p.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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

        <GlassCard style={styles.footer} intensity={40}>
          <PrimaryButton
            label="Agregar al carrito"
            onPress={() => add({ productId: product.id, name: product.name, price: product.price, size })}
          />
        </GlassCard>
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
  back: { minHeight: 44, paddingHorizontal: spacing.lg },
  topTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },
  spacer: { width: 80 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 24, gap: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  caption: { color: colors.textMuted, fontSize: 13 },
  price: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
  garmentRow: { flexDirection: 'row', gap: spacing.sm },
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
  sizeTextActive: { color: colors.textOnAccent, fontWeight: '600' },
  footer: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
