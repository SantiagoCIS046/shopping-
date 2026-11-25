import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductImage } from '../components/ProductImage';
import { TryOnCanvas } from '../components/TryOnCanvas';
import { colors, radius, spacing } from '../shop/tokens';
import { categoryLabel, formatCOP, Product, productRef, products } from '../data/products';
import { useCart } from '../context/CartContext';

type Props = {
  product: Product;
  onBack: () => void;
  onOpenCart: () => void;
};

const FREE_SHIPPING_FROM = 300000;

export function ProductScreen({ product, onBack, onOpenCart }: Props) {
  // Un solo producto "actual": la ficha, el probador, la talla y el carrito usan el mismo.
  const [current, setCurrent] = useState<Product>(product);
  const [size, setSize] = useState<string>(product.sizes[1] ?? product.sizes[0]);
  const [showTryOn, setShowTryOn] = useState(false);
  const { add } = useCart();

  const related = products.filter((p) => p.category === current.category && p.id !== current.id);

  function selectProduct(next: Product) {
    setCurrent(next);
    setSize(next.sizes[1] ?? next.sizes[0]);
    setShowTryOn(false);
  }

  function addToCart() {
    add({ productId: current.id, name: current.name, price: current.price, size });
  }

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={60} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {current.name}
          </Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Muestra directamente la fotografía del producto en alta definición */}
          {!showTryOn ? (
            <View style={styles.imageShowcase}>
              <ProductImage
                product={current}
                style={styles.showcaseImage}
                contentFit="contain"
                iconSize={54}
              />
            </View>
          ) : (
            <TryOnCanvas product={current} />
          )}

          {/* Botón opcional para activar o volver del probador virtual */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showTryOn ? 'Ver foto del producto' : 'Probar prenda'}
            onPress={() => setShowTryOn((prev) => !prev)}
            style={styles.tryOnToggle}
          >
            <Ionicons
              name={showTryOn ? 'image-outline' : 'sparkles-outline'}
              size={16}
              color={colors.accent}
            />
            <Text style={styles.tryOnToggleText}>
              {showTryOn ? 'Volver a la vista del producto' : 'Probar prenda sobre mi foto (Módulo Vista)'}
            </Text>
          </Pressable>

          {/* Ficha del producto: lo que el cliente necesita antes de comprar */}
          <GlassCard>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.name}>{current.name}</Text>
                <Text style={styles.category}>{categoryLabel(current.category)}</Text>
              </View>
              <Text style={styles.price}>{formatCOP(current.price)}</Text>
            </View>

            <View style={styles.divider} />

            <DetailRow label="Referencia" value={productRef(current)} />
            <DetailRow label="Categoría" value={categoryLabel(current.category)} />
            <DetailRow label="Tallas disponibles" value={current.sizes.join(' · ')} />
            <DetailRow label="Talla seleccionada" value={size} />
            <DetailRow label="Envío" value={`Gratis en compras desde ${formatCOP(FREE_SHIPPING_FROM)}`} />
          </GlassCard>

          <GlassCard>
            <Text style={styles.sectionLabel}>Talla</Text>
            <View style={styles.sizes}>
              {current.sizes.map((s) => {
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

          {related.length > 0 ? (
            <View style={styles.relatedBlock}>
              <Text style={styles.sectionLabel}>Más {categoryLabel(current.category).toLowerCase()}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
                {related.map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${p.name}`}
                    onPress={() => selectProduct(p)}
                    style={styles.relatedChip}
                  >
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.relatedPrice}>{formatCOP(p.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title="Agregar al carrito" onPress={addToCart} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              addToCart();
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  imageShowcase: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  tryOnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tryOnToggleText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  titleBlock: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  category: { color: colors.textMuted, fontSize: 12, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },
  price: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginVertical: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    gap: spacing.md,
  },
  detailLabel: { color: colors.textMuted, fontSize: 13 },
  detailValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
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
  relatedBlock: { gap: 0 },
  relatedRow: { gap: spacing.sm, paddingRight: spacing.xl },
  relatedChip: {
    width: 150,
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  relatedName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  relatedPrice: { color: colors.textMuted, fontSize: 12 },
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
