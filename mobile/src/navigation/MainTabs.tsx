import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ShopNavProvider, useShopNav, buildBubbles, buildSegments } from '../shop/shopNav';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import type { RootStackParamList, MainTabParamList } from './types';
import { ShopScreen } from '../screens/ShopScreen';
import { VistaScreen } from '../screens/VistaScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius, spacing } from '../shop/tokens';
import { VISTA_ENABLED } from '../config';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ShopNavProvider>
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarPosition: 'top' }}
      tabBar={(props) => (
        <TopNav
          {...props}
          fontsLoaded={fontsLoaded}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
    >
      <Tab.Screen name="Tienda">
        {() => (
          <ShopScreen
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onOpenProduct={(product) => navigation.navigate('Product', { product })}
          />
        )}
      </Tab.Screen>

      {VISTA_ENABLED ? (
        <Tab.Screen name="Vista">
          {() => <VistaScreen />}
        </Tab.Screen>
      ) : null}

      <Tab.Screen name="Carrito">{() => <CartScreen />}</Tab.Screen>

      <Tab.Screen name="Perfil">
        {() => <ProfileScreen onSignedOut={() => navigation.replace('Welcome')} />}
      </Tab.Screen>
    </Tab.Navigator>
    </ShopNavProvider>
  );
}

type TopNavProps = BottomTabBarProps & {
  fontsLoaded: boolean;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

/** Encabezado superior idéntico a la referencia visual: Menú hamburguesa, SHOPPING centrado, Buscador, Carrito con badge y Avatar. */
function TopNav({
  state,
  navigation,
  fontsLoaded,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
}: TopNavProps) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { bubble, setBubble, segment, setSegment, category, setCategory, meta } = useShopNav();
  const bubbles = buildBubbles(meta);
  const segments = buildSegments(meta);

  // Progreso de la búsqueda: 0 = logo y botones, 1 = cuadro de búsqueda desplegado
  const progress = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    Animated.timing(progress, { toValue: searchOpen ? 1 : 0, duration: 260, useNativeDriver: true }).start();
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
    inputRef.current?.blur();
    return undefined;
  }, [searchOpen, progress]);
  const fadeOut = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const boxSlide = progress.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  const activeName = state.routes[state.index]?.name;
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'S';

  const go = (name: string) => {
    setMenuOpen(false);
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* 1. Botón Hamburguesa circular a la izquierda */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menú principal de navegación"
          onPress={() => setMenuOpen((v) => !v)}
          hitSlop={8}
          style={styles.circleBtn}
        >
          <View style={styles.hamburgerWrap}>
            <View style={styles.hamburgerBar} />
            <View style={styles.hamburgerBar} />
            <View style={styles.hamburgerBar} />
          </View>
        </Pressable>

        {/* 2. Logo 'SHOPPING' matemáticamente centrado en toda la barra */}
        <Animated.View
          style={[styles.centerContainer, { opacity: fadeOut }]}
          pointerEvents={searchOpen ? 'none' : 'box-none'}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir al inicio de la tienda"
            onPress={() => {
              setSearchQuery('');
              go('Tienda');
            }}
            hitSlop={10}
          >
            <Text style={[styles.logo, !fontsLoaded && styles.logoFallback]}>SHOPPING</Text>
          </Pressable>
        </Animated.View>

        {/* 3. Bloque derecho en la esquina: Buscar, Carrito y Perfil, uno al lado del otro */}
        <Animated.View style={styles.rightGroup} pointerEvents="box-none">
          {/* Buscador: abre el cuadro de búsqueda y la lupa se desvanece */}
          <Animated.View style={{ opacity: fadeOut }} pointerEvents={searchOpen ? 'none' : 'auto'}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar productos"
            onPress={() => {
              go('Tienda');
              setSearchOpen(true);
            }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={19} color="#FFFFFF" />
          </Pressable>
          </Animated.View>

          {/* Carrito con badge azul */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Carrito de compras, ${count} artículos`}
            onPress={() => go('Carrito')}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="bag-outline" size={19} color="#FFFFFF" />
            {count > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            ) : null}
          </Pressable>

          {/* Avatar con inicial en círculo azul */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mi perfil"
            onPress={() => go('Perfil')}
            hitSlop={6}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </Animated.View>

        {/* Cuadro de búsqueda: se desliza desde la derecha y reemplaza al logo */}
        <Animated.View
          style={[
            styles.searchField,
            { opacity: progress, transform: [{ translateX: boxSlide }] },
          ]}
          pointerEvents={searchOpen ? 'auto' : 'none'}
        >
          <Ionicons name="search-outline" size={18} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            ref={inputRef}
            placeholder="Buscar prendas, marcas o referencias..."
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Al borrar todo el texto, el cuadro se reduce otra vez al icono de lupa
              if (text.length === 0) setSearchOpen(false);
            }}
            onBlur={() => {
              // Al quitar el teclado sin texto, el cuadro vuelve a ser la lupa
              if (!searchQuery) setSearchOpen(false);
            }}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar búsqueda"
            onPress={() => {
              Keyboard.dismiss();
              setSearchQuery('');
              setSearchOpen(false);
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
          </Pressable>
        </Animated.View>
      </View>

      {/* Menú desplegable completo del botón hamburguesa */}
      {menuOpen ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
          <ScrollView style={styles.menuCard} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderTitle}>Navegación</Text>
              <Pressable onPress={() => setMenuOpen(false)} hitSlop={6}>
                <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.menuDivider} />

            <MenuItem
              icon="storefront-outline"
              label="Tienda y Catálogo"
              active={activeName === 'Tienda'}
              onPress={() => go('Tienda')}
            />
            <MenuItem
              icon="search-outline"
              label="Buscar prendas"
              onPress={() => {
                setMenuOpen(false);
                go('Tienda');
                setSearchOpen(true);
              }}
            />
            <MenuItem
              icon="bag-outline"
              label="Mi Carrito"
              badge={count > 0 ? String(count) : undefined}
              active={activeName === 'Carrito'}
              onPress={() => go('Carrito')}
            />
            <MenuItem
              icon="receipt-outline"
              label="Mis Pedidos"
              onPress={() => go('Perfil')}
            />
            <MenuItem
              icon="person-outline"
              label="Mi Perfil"
              active={activeName === 'Perfil'}
              onPress={() => go('Perfil')}
            />
            {VISTA_ENABLED ? (
              <MenuItem
                icon="sparkles-outline"
                label="Probador Virtual"
                active={activeName === 'Vista'}
                onPress={() => go('Vista')}
              />
            ) : null}

            <View style={styles.menuDivider} />
            <Text style={styles.menuHeaderTitle}>Categorías</Text>
            <MenuItem
              icon="grid-outline"
              label="Todas las categorías"
              active={activeName === 'Tienda' && category === ''}
              onPress={() => {
                setCategory('');
                go('Tienda');
              }}
            />
            {(meta?.prendas ?? []).map((c) => (
              <MenuItem
                key={c.slug}
                icon="shirt-outline"
                label={c.name}
                active={activeName === 'Tienda' && category === c.slug}
                onPress={() => {
                  setCategory(c.slug);
                  go('Tienda');
                }}
              />
            ))}

            <View style={styles.menuDivider} />
            <Text style={styles.menuHeaderTitle}>Colecciones</Text>
            {bubbles.map((b) => (
              <MenuItem
                key={b.id}
                icon={b.icon}
                label={b.label}
                active={activeName === 'Tienda' && bubble === b.id}
                onPress={() => {
                  setBubble(b.id);
                  go('Tienda');
                }}
              />
            ))}

            <View style={styles.menuDivider} />
            <Text style={styles.menuHeaderTitle}>Segmento</Text>
            {segments.map((s) => (
              <MenuItem
                key={s.id}
                icon="people-outline"
                label={s.label}
                active={activeName === 'Tienda' && segment === s.id}
                onPress={() => {
                  setSegment(s.id);
                  go('Tienda');
                }}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

    </View>
  );
}

function MenuItem({
  icon,
  label,
  active,
  badge,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.menuRow, active && styles.menuRowActive]}
    >
      <Ionicons name={icon} size={18} color={active ? colors.accent : colors.textSecondary} />
      <Text style={[styles.menuText, active && styles.menuTextActive]}>{label}</Text>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
    elevation: 0,
  },
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1523',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 10,
  },
  hamburgerWrap: {
    width: 16,
    height: 11,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hamburgerBar: {
    width: 16,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: '#F5F6EF',
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  logoFallback: {
    fontFamily: 'serif',
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 30,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3470E4',
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    fontWeight: '700',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#346FE3',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  searchField: {
    position: 'absolute',
    left: 52,
    right: 88, // ocupa el lugar de la lupa, que se desvanece al abrir la búsqueda
    zIndex: 20, // por encima de los íconos, para que la X reciba los toques
    top: 9,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.body,
    paddingVertical: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 40,
  },
  menuCard: {
    position: 'absolute',
    top: 66,
    left: 16,
    width: 220,
    maxHeight: 460,
    zIndex: 50,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  menuHeaderTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  menuRowActive: {
    backgroundColor: colors.accentSoft,
  },
  menuText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    flex: 1,
  },
  menuTextActive: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
  },
  menuBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3470E4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
