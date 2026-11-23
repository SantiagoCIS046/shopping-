import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList, MainTabParamList } from './types';
import { ShopScreen } from '../screens/ShopScreen';
import { VistaScreen } from '../screens/VistaScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../shop/tokens';
import { fill } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Navegación principal: barra flotante glass viva — botón activo con
 * degradado azul, glow pulsante e íconos claros. Al tocar una pestaña,
 * el botón rebota como una gota de agua.
 */
export function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tab.Screen name="Tienda">
        {() => (
          <ShopScreen
            onOpenProduct={(product) => navigation.navigate('Product', { product })}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Vista">
        {() => <VistaScreen />}
      </Tab.Screen>

      <Tab.Screen name="Carrito">{() => <CartScreen />}</Tab.Screen>

      <Tab.Screen name="Perfil">
        {() => <ProfileScreen onSignedOut={() => navigation.replace('Welcome')} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/** Barra flotante glass que envuelve los botones de los módulos. */
function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const { user } = useAuth();

  const meta: Array<{ icon: IconName; label: string; badge?: number; initial?: string }> = [
    { icon: 'storefront-outline', label: 'Tienda' },
    { icon: 'videocam-outline', label: 'Vista' },
    { icon: 'cart-outline', label: 'Carrito', badge: count },
    {
      icon: 'person-outline',
      label: 'Perfil',
      initial: user?.name?.trim().charAt(0).toUpperCase(),
    },
  ];

  return (
    <View pointerEvents="box-none" style={styles.outer}>
      <View style={styles.bar}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.barTint} />
        {/* Filo superior luminoso */}
        <LinearGradient
          colors={['rgba(127, 176, 255, 0)', 'rgba(127, 176, 255, 0.55)', 'rgba(127, 176, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.barGlowLine}
        />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const info = meta[index];
            return (
              <GlassTabButton
                key={route.key}
                icon={info.icon}
                label={info.label}
                badge={info.badge}
                initial={info.initial}
                focused={isFocused}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
        {/* El glass baja hasta el borde físico de la pantalla */}
        <View style={{ height: insets.bottom }} pointerEvents="none" />
      </View>
    </View>
  );
}

/**
 * Botón glass con animación de gota de agua y, cuando está activo,
 * degradado azul con glow que respira suavemente.
 */
function GlassTabButton({
  icon,
  label,
  badge,
  initial,
  focused,
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: number;
  initial?: string;
  focused: boolean;
  onPress: () => void;
}) {
  const drop = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  const playDrop = () => {
    Animated.sequence([
      Animated.timing(drop, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(drop, {
        toValue: 0,
        friction: 3.2,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Gota también cuando la pestaña se activa por otra vía
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current) playDrop();
    wasFocused.current = focused;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  // Respiración suave del botón activo
  useEffect(() => {
    if (!focused) {
      breathe.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [focused, breathe]);

  const scaleX = drop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const scaleY = drop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={() => {
        playDrop();
        onPress();
      }}
      style={styles.buttonWrap}
    >
      <Animated.View
        style={[
          styles.button,
          focused && styles.buttonFocused,
          { transform: [{ scale: breatheScale }, { scaleX }, { scaleY }] },
        ]}
      >
        {initial ? (
          <View style={[styles.avatar, focused && styles.avatarFocused]}>
            <Text style={[styles.avatarText, focused && styles.avatarTextFocused]}>{initial}</Text>
          </View>
        ) : (
          <Ionicons
            name={icon}
            size={focused ? 22 : 20}
            color={focused ? '#FFFFFF' : '#A9C3F2'}
          />
        )}

        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Animated.View>

      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    borderTopLeftRadius: radius.xl + 2,
    borderTopRightRadius: radius.xl + 2,
    overflow: 'hidden',
  },
  barTint: {
    ...fill,
    backgroundColor: 'rgba(13, 27, 54, 0.52)',
    borderTopWidth: 1,
    borderColor: 'rgba(127, 176, 255, 0.22)',
  },
  barGlowLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  buttonWrap: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  buttonFocused: {
    backgroundColor: 'rgba(127, 176, 255, 0.14)',
    borderColor: 'rgba(158, 194, 255, 0.85)',
    shadowColor: '#5C97FF',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(109, 157, 243, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(127, 176, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  avatarText: { color: '#A9C3F2', fontSize: 12, fontWeight: '700' },
  avatarTextFocused: { color: '#FFFFFF' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(62, 123, 250, 0.55)',
  },
  badgeText: { color: '#3E7BFA', fontSize: 9.5, fontWeight: '800' },
  label: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(190, 210, 245, 0.75)',
    marginTop: 2,
  },
  labelFocused: {
    color: '#9ECEFF',
  },
});
