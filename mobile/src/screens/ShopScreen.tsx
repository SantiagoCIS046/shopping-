import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { ProductCard } from '../components/ProductCard';
import { GlassCard } from '../components/GlassCard';
import { useCart } from '../context/CartContext';
import type { Product } from '../data/products';
import {
  fetchCategories,
  fetchProducts,
  CatalogCategories,
  CatalogFilters,
  CatalogProduct,
  CatalogSizeOption,
} from '../api/catalog';
import { colors, radius, spacing, tabBarSpacing } from '../shop/tokens';
import { fill } from '../theme';

type Props = {
  onOpenProduct: (product: Product) => void;
};

type Bubble = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent?: boolean; // Ofertas resaltada en otro color
  filters: CatalogFilters;
};

const SEGMENT_LABEL: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  unisex: 'Unisex',
  ninos: 'Niños',
};

const COLLECTION_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  basicos: 'shirt-outline',
  streetwear: 'flash-outline',
  deportivo: 'barbell-outline',
};

const PRICE_RANGES: Array<{ id: string; label: string; min?: number; max?: number }> = [
  { id: 'p1', label: 'Menos de $50 mil', max: 49999 },
  { id: 'p2', label: '$50 – $100 mil', min: 50000, max: 100000 },
  { id: 'p3', label: 'Más de $100 mil', min: 100001 },
];

const SORTS: Array<{ id: NonNullable<CatalogFilters['sort']>; label: string }> = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'precio-asc', label: 'Menor precio' },
  { id: 'precio-desc', label: 'Mayor precio' },
  { id: 'vendidos', label: 'Más vendidos' },
];

/**
 * Tienda (dashboard) con navegación en 3 niveles:
 * A) Burbujas de acceso rápido (Lo Nuevo, Ofertas, Más Vendidos, colecciones)
 * B) Pestañas por segmento (solo las que el local maneja)
 * C) Chips de categoría + filtros (talla sin stock tachada, precio, orden)
 * Todo alimentado por las categorías dinámicas del backend.
 */
export function ShopScreen({ onOpenProduct }: Props) {
  const { add } = useCart();

  const [meta, setMeta] = useState<CatalogCategories | null>(null);
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bubble, setBubble] = useState<string>('lo-nuevo');
  const [segment, setSegment] = useState('todo');
  const [category, setCategory] = useState<string>('');
  const [size, setSize] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState<NonNullable<CatalogFilters['sort']>>('recientes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Tallas del contexto actual (camisas → S-XL, zapatos → 38-44…)
  const [sizeOptions, setSizeOptions] = useState<CatalogSizeOption[]>([]);

  // Cambiar el contexto de navegación limpia la talla elegida
  const changeBubble = (id: string) => {
    setBubble(id);
    setSize('');
  };
  const changeSegment = (id: string) => {
    setSegment(id);
    setSize('');
  };
  const changeCategory = (slug: string) => {
    setCategory(slug);
    setSize('');
  };

  // Al elegir categoría el cuadro se colapsa, pero la selección queda guardada
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const selectCategory = (slug: string) => {
    changeCategory(slug);
    setCategoriesOpen(false);
  };

  const [addedName, setAddedName] = useState<string | null>(null);
  const pillOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCategories()
      .then(setMeta)
      .catch(() => setError('No pudimos cargar las categorías'));
  }, []);

  const bubbleFilters: Record<string, CatalogFilters> = {
    'lo-nuevo': { onlyNew: true },
    ofertas: { onlySale: true },
    'mas-vendidos': { onlyBest: true },
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const collectionTag = meta?.colecciones.find((c) => c.slug === bubble)?.slug;
      const tag = collectionTag
        ? `#${collectionTag === 'basicos' ? 'basico' : collectionTag === 'streetwear' ? 'urbano' : 'gym'}`
        : undefined;
      const range = PRICE_RANGES.find((p) => p.id === priceRange);
      const filters: CatalogFilters = {
        ...(bubbleFilters[bubble] ?? {}),
        segment,
        category: category || undefined,
        tag,
        size: size || undefined,
        minPrice: range?.min,
        maxPrice: range?.max,
        sort,
      };
      const data = await fetchProducts(filters);
      setProducts(data.products);
      setSizeOptions(data.sizes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar los productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubble, segment, category, size, priceRange, sort, meta]);

  useEffect(() => {
    load();
  }, [load]);

  // Aviso breve "Agregado ✓"
  useEffect(() => {
    if (!addedName) return;
    Animated.timing(pillOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(pillOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setAddedName(null);
        },
      );
    }, 1400);
    return () => clearTimeout(timer);
  }, [addedName, pillOpacity]);

  const toCardProduct = (p: CatalogProduct): Product => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.discountPrice ?? p.price,
    sizes: p.sizes.map((s) => s.size),
    image: p.image,
  });

  const addToCart = (p: CatalogProduct) => {
    const card = toCardProduct(p);
    // Talla por defecto: la primera con stock
    const withStock = p.sizes.find((s) => s.available > 0)?.size ?? card.sizes[0];
    add({ productId: card.id, name: card.name, price: card.price, size: withStock });
    setAddedName(card.name);
  };

  const bubbles: Bubble[] = [
    { id: 'lo-nuevo', label: 'Lo Nuevo', icon: 'sparkles-outline', filters: { onlyNew: true } },
    { id: 'ofertas', label: 'Ofertas', icon: 'pricetag-outline', accent: true, filters: { onlySale: true } },
    { id: 'mas-vendidos', label: '+ Vendidos', icon: 'trending-up-outline', filters: { onlyBest: true } },
    ...(meta?.colecciones ?? []).map((c) => ({
      id: c.slug,
      label: c.name.split(' ')[0],
      icon: COLLECTION_ICON[c.slug] ?? 'layers-outline',
      filters: { tag: c.slug },
    })),
  ];

  const activeFilters = [size, priceRange].filter(Boolean).length;

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Barra superior */}
        <View style={styles.topBar}>
          <Text style={styles.title}>Shopping</Text>
          <Text style={styles.subtitle}>Encuentra tu prenda en 2 o 3 toques</Text>
        </View>

        {addedName ? (
          <Animated.View pointerEvents="none" style={[styles.pill, { opacity: pillOpacity }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.pillText} numberOfLines={1}>
              {addedName} agregado al carrito
            </Text>
          </Animated.View>
        ) : null}

        {/* Bloque fijo de controles: nunca se va con el scroll de los módulos */}
        <View style={styles.headerBlock}>
        {/* Nivel A: burbujas de acceso rápido */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bubbles}>
            {bubbles.map((b) => {
              const active = bubble === b.id;
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => changeBubble(b.id)}
                  style={styles.bubbleWrap}
                >
                  <View
                    style={[
                      styles.bubble,
                      active && b.accent && styles.bubbleAccentActive,
                      active && !b.accent && styles.bubbleActive,
                      !active && b.accent && styles.bubbleAccent,
                    ]}
                  >
                    <Ionicons
                      name={b.icon}
                      size={18}
                      color={active ? (b.accent ? '#FFFFFF' : colors.accent) : b.accent ? '#F59E0B' : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.bubbleLabel, active && styles.bubbleLabelActive, b.accent && styles.bubbleLabelAccent]}>
                    {b.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Nivel B: pestañas de segmento (dinámicas) */}
          <View style={styles.segmentRow}>
            {[{ id: 'todo', label: 'Todo' }, ...(meta?.segments ?? []).map((s) => ({ id: s, label: SEGMENT_LABEL[s] ?? s }))].map(
              (tab) => {
                const active = segment === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => changeSegment(tab.id)}
                    style={[styles.segment, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>

        </View>

        {/* Zona de módulos: el grid corre por DETRÁS del cuadro flotante de categorías */}
        <View style={styles.gridZone}>

          {/* Grid de productos: scroll propio, nunca toca los botones de categoría */}
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={products ?? []}
              keyExtractor={(p) => p.id}
              numColumns={2}
              style={styles.gridFlex}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.empty}>No hay prendas con estos filtros. Prueba otra combinación.</Text>
              }
              renderItem={({ item }) => {
                const card = toCardProduct(item);
                return (
                  <ProductCard
                    product={card}
                    onOpen={() => onOpenProduct(card)}
                    onAddToCart={() => addToCart(item)}
                  />
                );
              }}
            />
          )}

          {/* Cuadro de categorías flotante: las tarjetas pasan por detrás */}
          <View style={styles.categoryBar} pointerEvents="box-none">
            <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.categoryTint} />

            {categoriesOpen ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chips}
                nestedScrollEnabled
              >
                <Chip label="Todo" active={!category} onPress={() => selectCategory('')} />
                {(meta?.prendas ?? []).map((c) => (
                  <Chip
                    key={c.slug}
                    label={c.name}
                    active={category === c.slug}
                    onPress={() => selectCategory(c.slug)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cambiar categoría"
                onPress={() => setCategoriesOpen(true)}
                style={styles.selectedPill}
              >
                <Ionicons name="grid-outline" size={15} color={colors.accent} />
                <Text style={styles.selectedPillText} numberOfLines={1}>
                  {category
                    ? (meta?.prendas.find((c) => c.slug === category)?.name ?? 'Categoría')
                    : 'Todas las categorías'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar"
              onPress={() => setFiltersOpen((v) => !v)}
              style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}
            >
              <Ionicons name="options-outline" size={16} color={activeFilters > 0 ? colors.accent : colors.textSecondary} />
              {activeFilters > 0 ? (
                <Text style={styles.filterBtnTextActive}>{activeFilters}</Text>
              ) : null}
            </Pressable>
          </View>

          {/* Panel de filtros superpuesto al grid: compacto, gris claro */}
          {filtersOpen ? (
            <View style={styles.filtersFloat} pointerEvents="box-none">
              <GlassCard compact light>
                <Text style={styles.filterTitle}>
                  {category
                    ? `Tallas de ${meta?.prendas.find((c) => c.slug === category)?.name ?? 'la categoría'}`
                    : 'Tallas del catálogo visible'}
                </Text>
                <View style={styles.filterRow}>
                  {sizeOptions.length === 0 ? (
                    <Text style={styles.panelHint}>Sin tallas en este contexto</Text>
                  ) : (
                    sizeOptions.map((option) => {
                      const active = size === option.size;
                      return (
                        <Pressable
                          key={option.size}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setSize(active ? '' : option.size)}
                          style={[styles.panelChip, active && styles.panelChipActive]}
                        >
                          <Text
                            style={[
                              styles.panelChipText,
                              active && styles.panelChipTextActive,
                              !option.inStock && styles.sizeChipSoldOut,
                            ]}
                          >
                            {option.size}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
                <Text style={styles.filterTitle}>Precio</Text>
                <View style={styles.filterRow}>
                  {PRICE_RANGES.map((r) => (
                    <Pressable
                      key={r.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: priceRange === r.id }}
                      onPress={() => setPriceRange(priceRange === r.id ? '' : r.id)}
                      style={[styles.panelChip, priceRange === r.id && styles.panelChipActive]}
                    >
                      <Text style={[styles.panelChipText, priceRange === r.id && styles.panelChipTextActive]}>
                        {r.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.filterTitle}>Ordenar por</Text>
                <View style={styles.filterRow}>
                  {SORTS.map((s) => (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sort === s.id }}
                      onPress={() => setSort(s.id)}
                      style={[styles.panelChip, sort === s.id && styles.panelChipActive]}
                    >
                      <Text style={[styles.panelChipText, sort === s.id && styles.panelChipTextActive]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.panelHint}>Las tallas tachadas no tienen stock disponible.</Text>
              </GlassCard>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  headerBlock: { flexShrink: 1, flexGrow: 0 },
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm + 4, paddingBottom: 2 },
  title: { color: colors.textPrimary, fontSize: 21, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 11.5, marginTop: 1 },
  pill: {
    position: 'absolute',
    bottom: tabBarSpacing + 24,
    alignSelf: 'center',
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '86%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(11, 23, 51, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.4)',
  },
  pillText: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '500' },
  bubbles: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.md },
  bubbleWrap: { alignItems: 'center', gap: 4, width: 54 },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bubbleActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bubbleAccent: { borderColor: 'rgba(245, 158, 11, 0.45)' },
  bubbleAccentActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bubbleLabel: { color: colors.textMuted, fontSize: 9.5, textAlign: 'center' },
  bubbleLabelActive: { color: colors.textPrimary, fontWeight: '600' },
  bubbleLabelAccent: { color: '#F5B942' },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    padding: 3,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  segment: {
    flex: 1,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder },
  segmentText: { color: 'rgba(220, 228, 242, 0.82)', fontSize: 12.5, fontWeight: '600' },
  segmentTextActive: { color: colors.textPrimary },
  toolsRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.xl, gap: spacing.sm },
  gridZone: { flex: 1 },
  categoryBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    overflow: 'hidden',
  },
  categoryTint: {
    ...fill,
    backgroundColor: 'rgba(11, 23, 51, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  selectedPill: {
    flex: 1,
    height: 32,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  selectedPillText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', flex: 1 },
  filtersFloat: {
    position: 'absolute',
    top: 52,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 20,
  },
  chipsScroll: { flex: 1 },
  chips: { gap: spacing.sm, paddingRight: spacing.sm, paddingVertical: 6 },
  chip: {
    height: 30,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  chipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  chipText: { color: 'rgba(220, 228, 242, 0.9)', fontSize: 11.5 },
  chipTextActive: { color: colors.textPrimary, fontWeight: '600' },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  filterBtnActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  filterBtnTextActive: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  filtersCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md },
  filterTitle: { color: 'rgba(214, 222, 234, 0.72)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  panelChip: {
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(203, 211, 224, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  panelChipActive: {
    borderColor: 'rgba(203, 211, 224, 0.75)',
    backgroundColor: colors.accent,
  },
  panelChipText: { color: 'rgba(228, 234, 244, 0.92)', fontSize: 11.5, fontWeight: '500' },
  panelChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  panelHint: { color: 'rgba(214, 222, 234, 0.55)', fontSize: 10.5, textAlign: 'center' },
  sizeChip: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeChipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  sizeChipText: { color: colors.textSecondary, fontSize: 11.5 },
  sizeChipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  sizeChipSoldOut: { textDecorationLine: 'line-through', opacity: 0.45 },
  soldOutHint: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  loader: { marginVertical: 40 },
  error: { color: colors.danger, textAlign: 'center', marginVertical: 30, paddingHorizontal: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 30, paddingHorizontal: spacing.xl },
  gridFlex: { flex: 1 },
  grid: { paddingTop: 54, paddingBottom: tabBarSpacing + spacing.xxl },
  gridRow: { gap: 10, marginBottom: spacing.lg, paddingHorizontal: 0 },
});
