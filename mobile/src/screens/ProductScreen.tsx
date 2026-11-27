import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductImage } from '../components/ProductImage';
import { OutfitTryOn } from '../components/OutfitTryOn';
import { colors, radius, spacing } from '../shop/tokens';
import { useStockIndex } from '../shop/stock';
import { categoryLabel, formatCOP, Product, products } from '../data/products';
import { useCart } from '../context/CartContext';
import { VISTA_ENABLED } from '../config';

type Props = {
  product: Product;
  onBack: () => void;
  onOpenCart: () => void;
};

const FREE_SHIPPING_FROM = 300000;

// Colores de lectura: opacos y con buen contraste sobre el fondo oscuro difuminado.
const TEXT_MAIN = '#FFFFFF';
const TEXT_SOFT = 'rgba(236, 240, 248, 0.92)';

export function ProductScreen({ product, onBack, onOpenCart }: Props) {
  // Un solo producto "actual": la ficha, el probador, la talla y el carrito usan el mismo.
  const [current, setCurrent] = useState<Product>(product);
  const [size, setSize] = useState<string>(product.sizes[1] ?? product.sizes[0]);
  const [showTryOn, setShowTryOn] = useState(false);
  const { add } = useCart();

  const related = products.filter((p) => p.category === current.category && p.id !== current.id);

  // Stock, precio y referencia reales del servidor (la referencia la calcula solo el servidor)
  const index = useStockIndex([current.id]);
  const info = index?.[current.id];

  // Filas de talla: con stock real si ya llegó del servidor; si no, las locales
  const sizeRows: Array<{ size: string; available: number | null }> = info
    ? info.sizes.map((v) => ({ size: v.size, available: v.available }))
    : current.sizes.map((s) => ({ size: s, available: null }));
  const selectedRow = sizeRows.find((r) => r.size === size);
  const selectedVariant = info?.sizes.find((v) => v.size === size);
  const displayPrice = info?.price ?? current.price;
  const soldOut = info ? (selectedRow?.available ?? 0) === 0 : false;
  const availableSizes = sizeRows.filter((r) => r.available !== 0).map((r) => r.size);

  // Si la talla elegida está agotada o no existe, pasa a la primera con stock
  useEffect(() => {
    if (!info) return;
    const chosen = info.sizes.find((v) => v.size === size);
    if (!chosen || chosen.available === 0) {
      setSize(info.sizes.find((v) => v.available > 0)?.size ?? size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  function selectProduct(next: Product) {
    setCurrent(next);
    setSize(next.sizes[1] ?? next.sizes[0]);
    setShowTryOn(false);
  }

  function addToCart() {
    if (soldOut) return;
    add({
      productId: current.id,
      name: current.name,
      price: selectedVariant?.price ?? displayPrice,
      size,
    });
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
              <ProductImage product={current} style={styles.showcaseImage} contentFit="contain" iconSize={54} />
            </View>
          ) : (
            <OutfitTryOn key={current.id} initial={current} />
          )}

          {VISTA_ENABLED ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showTryOn ? 'Ver foto del producto' : 'Probar prenda'}
            onPress={() => setShowTryOn((prev) => !prev)}
            style={styles.tryOnToggle}
          >
            <Ionicons name={showTryOn ? 'image-outline' : 'sparkles-outline'} size={16} color={colors.accent} />
            <Text style={styles.tryOnToggleText}>
              {showTryOn ? 'Volver a la vista del producto' : 'Probar prenda sobre mi foto (Módulo Vista)'}
            </Text>
          </Pressable>
          ) : null}

          {/* Ficha del producto: lo que el cliente necesita antes de comprar */}
          <GlassCard>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.name}>{current.name}</Text>
                <Text style={styles.category}>{categoryLabel(current.category)}</Text>
              </View>
              <Text style={styles.price}>{formatCOP(displayPrice)}</Text>
            </View>

            <View style={styles.divider} />

            <DetailRow label="Referencia" value={info?.ref ?? 'Sin referencia'} />
            <DetailRow label="Categoría" value={categoryLabel(current.category)} />
            <DetailRow
              label="Tallas disponibles"
              value={availableSizes.length > 0 ? availableSizes.join(' · ') : 'Agotado'}
            />
            <DetailRow label="Talla seleccionada" value={size} />
            <DetailRow label="Envío" value={`Gratis en compras desde ${formatCOP(FREE_SHIPPING_FROM)}`} />
          </GlassCard>

          <GlassCard>
            <Text style={styles.sectionLabel}>Talla</Text>
            <View style={styles.sizes}>
              {sizeRows.map((row) => {
                const selected = row.size === size;
                const out = row.available === 0;
                return (
                  <Pressable
                    key={row.size}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: out }}
                    disabled={out}
                    onPress={() => setSize(row.size)}
                    style={[styles.size, selected && styles.sizeActive, out && styles.sizeOut]}
                  >
                    <Text style={[styles.sizeText, selected && styles.sizeTextActive, out && styles.sizeTextOut]}>
                      {row.size}
                    </Text>
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
          <PrimaryButton
            title={soldOut ? 'Agotado en esta talla' : 'Agregar al carrito'}
            onPress={addToCart}
            disabled={soldOut}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: soldOut }}
            onPress={() => {
              if (soldOut) return;
              addToCart();
              onOpenCart();
            }}
            style={[styles.buyNow, soldOut && styles.disabled]}
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
  backText: { color: TEXT_MAIN, fontSize: 16, fontWeight: '600' },
  topTitle: { color: TEXT_MAIN, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
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
  showcaseImage: { width: '100%', height: '100%' },
  tryOnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tryOnToggleText: { color: TEXT_MAIN, fontSize: 15, fontWeight: '600' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  titleBlock: { flex: 1 },
  name: { color: TEXT_MAIN, fontSize: 20, fontWeight: '700' },
  category: {
    color: TEXT_SOFT,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: { color: TEXT_MAIN, fontSize: 20, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginVertical: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.md,
  },
  detailLabel: { color: TEXT_SOFT, fontSize: 14, fontWeight: '500' },
  detailValue: { color: TEXT_MAIN, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  sectionLabel: { color: TEXT_MAIN, fontSize: 15, fontWeight: '700', marginBottom: spacing.md, textAlign: 'center' },
  sizes: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  size: {
    width: 42,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeActive: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  sizeOut: { opacity: 0.4 },
  sizeText: { color: TEXT_MAIN, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  sizeTextActive: { color: TEXT_MAIN, fontWeight: '700' },
  sizeTextOut: { textDecorationLine: 'line-through' },
  relatedBlock: { gap: 0 },
  relatedRow: { gap: spacing.sm, paddingRight: spacing.xl },
  relatedChip: {
    width: 150,
    minHeight: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  relatedName: { color: TEXT_MAIN, fontSize: 14, fontWeight: '600' },
  relatedPrice: { color: TEXT_SOFT, fontSize: 14, fontWeight: '600' },
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
  disabled: { opacity: 0.4 },
  buyNowText: { color: TEXT_MAIN, fontSize: 16, fontWeight: '700' },
});
