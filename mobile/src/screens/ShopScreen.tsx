import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { ProductCard } from '../components/ProductCard';
import { GlassCard } from '../components/GlassCard';
import { useCart } from '../context/CartContext';
import type { Product } from '../data/products';
import { fetchProducts, CatalogFilters, CatalogProduct, CatalogSizeOption } from '../api/catalog';
import { buildBubbles, buildSegments, useShopNav } from '../shop/shopNav';
import { colors, fonts, radius, spacing, tabBarSpacing } from '../shop/tokens';
import { fill, INTRO_IMAGE } from '../theme';

const BENEFITS = 'Envío gratis desde $300.000  ✦  Cambios hasta 30 días  ✦  Básicos premium  ✦  Nuevos drops cada temporada  ✦  ';

type Props = {
  onOpenProduct: (product: Product) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
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
export function ShopScreen({ onOpenProduct, searchQuery, onClearSearch }: Props) {
  const { add } = useCart();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  // Colección y segmento vienen del encabezado superior (estado compartido)
  const { bubble, setBubble, segment, setSegment, category, setCategory, meta } = useShopNav();
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState<NonNullable<CatalogFilters['sort']>>('recientes');
  // Tallas del contexto actual (camisas → S-XL, zapatos → 38-44…)
  const [sizeOptions, setSizeOptions] = useState<CatalogSizeOption[]>([]);

  // Cambiar colección o segmento limpia la talla elegida
  useEffect(() => {
    setSize('');
  }, [bubble, segment]);
  const changeBubble = (id: string) => setBubble(id);
  const changeSegment = (id: string) => setSegment(id);
  // Las categorías se eligen desde el menú superior (estado compartido)
  const selectCategory = (slug: string) => {
    setCategory(slug);
    setSize('');
  };

  const [addedName, setAddedName] = useState<string | null>(null);
  const pillOpacity = useRef(new Animated.Value(0)).current;

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
    const withStock = p.sizes.find((s) => s.available > 0);
    if (!withStock) {
      Alert.alert('Agotado', `${card.name} no tiene tallas disponibles.`);
      return;
    }
    add({ productId: card.id, name: card.name, price: withStock.price, size: withStock.size });
    setAddedName(card.name);
  };

  const bubbles = buildBubbles(meta);


  const filteredProducts = React.useMemo(() => {
    if (!products) return null;
    if (!searchQuery || !searchQuery.trim()) return products;
    const clean = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(clean);
      const matchCat = (p.categoryName || p.category || '').toLowerCase().includes(clean);
      const matchRef = p.ref ? p.ref.toLowerCase().includes(clean) : false;
      const matchTags = p.tags ? p.tags.some((t) => t.toLowerCase().includes(clean)) : false;
      return matchName || matchCat || matchRef || matchTags;
    });
  }, [products, searchQuery]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      {/* El encabezado con los módulos (Tienda, Vista, Carrito, Perfil) vive en MainTabs */}
      <SafeAreaView style={styles.safe} edges={[]}>
        {addedName ? (
          <Animated.View pointerEvents="none" style={[styles.pill, { opacity: pillOpacity }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.pillText} numberOfLines={1}>
              {addedName} agregado al carrito
            </Text>
          </Animated.View>
        ) : null}

        {/* Zona de módulos: el grid corre por DETRÁS del cuadro flotante de categorías */}
        <View style={styles.gridZone}>

          {/* Grid de productos: scroll propio, nunca toca los botones de categoría */}
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={filteredProducts ?? []}
              keyExtractor={(p) => p.id}
              numColumns={2}
              style={styles.gridFlex}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View>
                  <ShopHero
                    onShop={() => {
                      changeBubble('lo-nuevo');
                      changeSegment('todo');
                      selectCategory('');
                    }}
                  />
                  <BenefitsMarquee />
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>
                      {searchQuery && searchQuery.trim()
                        ? 'RESULTADOS DE BÚSQUEDA'
                        : (bubbles.find((b) => b.id === bubble)?.label ?? 'Colección').toUpperCase()}
                    </Text>
                    <Text style={styles.sectionCount}>
                      {filteredProducts?.length ?? 0} {filteredProducts?.length === 1 ? 'prenda' : 'prendas'}
                    </Text>
                  </View>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.empty}>
                    {searchQuery
                      ? `No encontramos prendas para "${searchQuery}".`
                      : 'No hay prendas con estos filtros. Prueba otra combinación.'}
                  </Text>
                  {searchQuery && onClearSearch ? (
                    <Pressable onPress={onClearSearch} style={styles.clearSearchBtn}>
                      <Text style={styles.clearSearchBtnText}>Limpiar búsqueda</Text>
                    </Pressable>
                  ) : null}
                </View>
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

          {/* Franja bajo el menú: tallas de la categoría elegida, luego precio y orden */}
          <View style={styles.categoryBar} pointerEvents="box-none">
            <View style={styles.categoryTint} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.stripScroll}
              contentContainerStyle={styles.stripRow}
              nestedScrollEnabled
            >
              {category && sizeOptions.length > 0
                ? sizeOptions.map((option) => {
                    const active = size === option.size;
                    return (
                      <Pressable
                        key={option.size}
                        accessibilityRole="button"
                        accessibilityLabel={`Talla ${option.size}${option.inStock ? '' : ', agotada'}`}
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
                : null}
              {category && sizeOptions.length > 0 ? <View style={styles.stripDivider} /> : null}
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
              <View style={styles.stripDivider} />
              {SORTS.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sort === s.id }}
                  onPress={() => setSort(s.id)}
                  style={[styles.panelChip, sort === s.id && styles.panelChipActive]}
                >
                  <Text style={[styles.panelChipText, sort === s.id && styles.panelChipTextActive]}>{s.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Portada: foto a sentido completo con degradado, título editorial y botón principal. */
function ShopHero({ onShop }: { onShop: () => void }) {
  return (
    <View style={styles.hero}>
      <Image source={INTRO_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" priority="high" />
      <LinearGradient
        colors={['rgba(5, 10, 22, 0)', 'rgba(5, 10, 22, 0.55)', colors.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>VISTE DISTINTO</Text>
        <Text style={styles.heroText}>Básicos premium y piezas de temporada, pensados para Colombia.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver la colección"
          onPress={onShop}
          style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
        >
          <Text style={styles.heroButtonText}>Ver la colección</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Cinta de beneficios que se desplaza sin fin (se detiene si el usuario reduce el movimiento). */
function BenefitsMarquee() {
  const shift = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    if (!segmentWidth) return undefined;
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.timing(shift, {
          toValue: -segmentWidth,
          duration: segmentWidth * 22,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
      shift.setValue(0);
    };
  }, [segmentWidth, shift]);

  return (
    <View style={styles.marquee}>
      <Animated.View style={[styles.marqueeTrack, { transform: [{ translateX: shift }] }]}>
        {[0, 1].map((i) => (
          <Text
            key={i}
            onLayout={i === 0 ? (e) => setSegmentWidth(e.nativeEvent.layout.width) : undefined}
            style={styles.marqueeText}
          >
            {BENEFITS}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  headerBlock: { flexShrink: 1, flexGrow: 0 },
  pressed: { transform: [{ scale: 0.97 }] },
  hero: { height: 380, overflow: 'hidden', backgroundColor: colors.bg, marginHorizontal: -spacing.lg },
  heroCopy: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: 2,
  },
  heroText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  heroButton: {
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentButton,
    marginTop: spacing.sm,
  },
  heroButtonText: { color: colors.textOnAccent, fontFamily: fonts.bodyBold, fontSize: 15 },
  marquee: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
    paddingVertical: spacing.sm + 2,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.glassBorder,
  },
  marqueeTrack: { flexDirection: 'row' },
  marqueeText: {
    flexShrink: 0,
    color: colors.accent,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 2,
  },
  sectionCount: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 },
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
  stripScroll: { flex: 1 },
  stripRow: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  stripDivider: { width: 1, height: 18, backgroundColor: colors.glassBorder, marginHorizontal: 2 },
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
    backgroundColor: colors.bgElevated,
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
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  menuFloat: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 25,
  },
  menuCard: {
    maxHeight: 420,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(14, 22, 40, 0.97)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  menuTitle: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  menuRowActive: { backgroundColor: colors.accentSoft },
  menuRowText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  menuRowTextActive: { color: colors.textPrimary, fontFamily: fonts.bodyBold },
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
    backgroundColor: colors.accentButton,
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
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  empty: { color: colors.textMuted, textAlign: 'center', marginVertical: 12, paddingHorizontal: spacing.xl },
  clearSearchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginTop: 8,
  },
  clearSearchBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  gridFlex: { flex: 1 },
  grid: { paddingTop: 54, paddingBottom: tabBarSpacing + spacing.xxl, paddingHorizontal: spacing.lg },
  gridRow: { gap: 12, marginBottom: spacing.lg, paddingHorizontal: 0 },
});
