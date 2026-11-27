import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductImage } from '../components/ProductImage';
import { CartItem, useCart } from '../context/CartContext';
import { formatCOP, products } from '../data/products';
import { FREE_SHIPPING_FROM, calcTotals } from '../shop/pricing';
import { colors, radius, spacing, tabBarSpacing } from '../shop/tokens';
import { useStockIndex, variantOf } from '../shop/stock';

/**
 * Carrito de compras: lista de lo escogido con cantidades, resumen
 * con impuesto nacional (IVA) y envío, y botón para pagar.
 * Verifica stock y precio reales con el servidor antes de dejar pagar.
 */
export function CartScreen() {
  const { items, total, count, setQuantity, remove, sync } = useCart();
  const totals = calcTotals(total);
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goPay = () => rootNavigation.navigate('Checkout');
  const goExplore = () => tabNavigation.navigate('Tienda');

  // Stock y precio reales del servidor para lo que hay en el carrito
  const isFocused = useIsFocused();
  const index = useStockIndex(
    items.map((i) => i.productId),
    isFocused,
  );

  // Al llegar la información del servidor: ajusta precios y topes de cantidad
  useEffect(() => {
    if (!index) return;
    sync(
      items.map((i) => {
        const v = variantOf(index, i.productId, i.size);
        return {
          productId: i.productId,
          size: i.size,
          price: v?.price ?? i.price,
          available: index[i.productId] ? (v?.available ?? 0) : 0,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Unidades disponibles de una línea (null = aún no sabemos)
  const availableOf = (item: CartItem): number | null => {
    if (!index) return null;
    if (!index[item.productId]) return 0;
    return variantOf(index, item.productId, item.size)?.available ?? 0;
  };

  // Motivo por el que una línea no se puede pagar tal como está (null = ok)
  const problemOf = (item: CartItem): string | null => {
    if (!index) return null;
    if (!index[item.productId]) return 'Este producto ya no está disponible';
    const available = availableOf(item) ?? 0;
    if (available === 0) return `Talla ${item.size} agotada`;
    if (item.quantity > available) return `Solo quedan ${available} en talla ${item.size}`;
    return null;
  };

  const blocked = items.some((i) => problemOf(i) !== null);

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Tu carrito</Text>
          {count > 0 ? <Text style={styles.count}>{count} artículo{count === 1 ? '' : 's'}</Text> : null}
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyText}>Explora la tienda y guarda lo que más te guste.</Text>
            <PrimaryButton title="Explorar la tienda" onPress={goExplore} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Barra de envío gratis */}
              <View style={styles.shippingBar}>
                <Ionicons
                  name={totals.freeShipping ? 'checkmark-circle' : 'car-outline'}
                  size={16}
                  color={totals.freeShipping ? colors.success : colors.textSecondary}
                />
                <Text style={styles.shippingText}>
                  {totals.freeShipping
                    ? '¡Tienes envío gratis!'
                    : `Te faltan ${formatCOP(totals.missingForFreeShipping)} para el envío gratis (desde ${formatCOP(FREE_SHIPPING_FROM)})`}
                </Text>
              </View>

              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const problem = problemOf(item);
                const available = availableOf(item);
                const plusDisabled = available !== null && item.quantity >= available;
                return (
                  <GlassCard key={`${item.productId}-${item.size}`} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <ProductImage
                        product={
                          product ?? {
                            id: item.productId,
                            name: item.name,
                            category: 'otros',
                            price: item.price,
                            sizes: [item.size],
                            image: null,
                          }
                        }
                        style={styles.thumb}
                        iconSize={20}
                      />

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemMeta}>Talla {item.size} · {formatCOP(item.price)}</Text>
                        {problem ? <Text style={styles.itemWarn}>{problem}</Text> : null}

                        <View style={styles.itemControls}>
                          <View style={styles.stepper}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Quitar una unidad de ${item.name}`}
                              onPress={() => setQuantity(item.productId, item.size, item.quantity - 1)}
                              style={styles.stepBtn}
                            >
                              <Ionicons name="remove" size={16} color={colors.textPrimary} />
                            </Pressable>
                            <Text style={styles.stepValue}>{item.quantity}</Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Agregar una unidad de ${item.name}`}
                              accessibilityState={{ disabled: plusDisabled }}
                              disabled={plusDisabled}
                              onPress={() => setQuantity(item.productId, item.size, item.quantity + 1)}
                              style={[styles.stepBtn, plusDisabled && styles.stepDisabled]}
                            >
                              <Ionicons name="add" size={16} color={colors.textPrimary} />
                            </Pressable>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar ${item.name} del carrito`}
                            onPress={() => remove(item.productId, item.size)}
                            hitSlop={8}
                            style={styles.trash}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}

              {/* Resumen con impuestos */}
              <GlassCard style={styles.summary}>
                <Line label="Subtotal" value={formatCOP(total)} />
                <Line label={totals.taxLabel} value={formatCOP(totals.taxAmount)} />
                <Line
                  label="Envío estándar"
                  value={totals.freeShipping ? 'Gratis' : formatCOP(totals.shipping)}
                />
                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total a pagar</Text>
                  <Text style={styles.totalValue}>{formatCOP(totals.total)}</Text>
                </View>
              </GlassCard>
            </ScrollView>

            <View style={styles.footer}>
              {blocked ? (
                <Text style={styles.warn}>Quita o ajusta los productos marcados para continuar.</Text>
              ) : null}
              <PrimaryButton title="Pagar" onPress={goPay} disabled={blocked} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  count: { color: colors.textMuted, fontSize: 13 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: tabBarSpacing + spacing.xxl, gap: spacing.md },
  shippingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  shippingText: { color: colors.textSecondary, fontSize: 12.5, flex: 1 },
  itemCard: {},
  itemRow: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 78, height: 96, borderRadius: radius.sm },
  itemInfo: { flex: 1 },
  itemName: { color: colors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  itemMeta: { color: colors.textMuted, fontSize: 12.5, marginTop: 2 },
  itemWarn: { color: colors.danger, fontSize: 12, fontWeight: '600', marginTop: 4 },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
  },
  stepDisabled: { opacity: 0.35 },
  stepValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', minWidth: 22, textAlign: 'center' },
  trash: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  summary: { marginTop: spacing.sm },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  lineLabel: { color: colors.textSecondary, fontSize: 14 },
  lineValue: { color: colors.textPrimary, fontSize: 14 },
  summaryDivider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: tabBarSpacing + spacing.lg },
  warn: { color: colors.danger, fontSize: 12.5, textAlign: 'center', marginBottom: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 13.5, textAlign: 'center' },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
