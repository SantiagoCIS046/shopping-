import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import Svg, { Polyline } from 'react-native-svg';
import { INTRO_IMAGE, colors, fill } from '../theme';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  /** Se llama cuando el desvanecimiento terminó; lo que estaba detrás queda activo. */
  onReveal: () => void;
};

/**
 * Plantilla de intro montada ENCIMA del login (o de la pantalla de carga).
 * El usuario arrastra hacia arriba y la intro se desvanece poco a poco
 * (fade de toda la capa + blur progresivo + velo oscuro), revelando
 * lo que hay detrás. Al completarse se desmonta.
 */
export function IntroOverlay({ onReveal }: Props) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold });
  const [blurAmount, setBlurAmount] = useState(0);

  const bounce = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const gestureValue = useRef(0);

  // Referencia fresca del callback (evita closures viejas dentro del PanResponder)
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    progress.addListener(({ value }) => {
      gestureValue.current = value;
      setBlurAmount(Math.round(value * 70));
    });
    return () => {
      progress.removeAllListeners();
    };
  }, [progress]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [bounce]);

  const springBack = () => {
    Animated.spring(progress, {
      toValue: 0,
      friction: 9,
      tension: 45,
      useNativeDriver: false,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy < -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,
      onPanResponderMove: (_event, gesture) => {
        const p = Math.min(1, Math.max(0, -gesture.dy / (SCREEN_H * 0.5)));
        progress.setValue(p);
      },
      onPanResponderRelease: (_event, gesture) => {
        const p = gestureValue.current;
        const flick = gesture.vy < -1.4;
        if (p > 0.25 || flick) {
          Animated.timing(progress, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) onRevealRef.current();
          });
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    }),
  ).current;

  // Toda la plantilla se desvanece mientras el usuario sube el scroll
  const fadeOut = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const veilOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.85],
  });
  const titleOpacity = progress.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  });
  const hintOpacity = progress.interpolate({
    inputRange: [0, 0.35],
    outputRange: [1, 0],
  });

  return (
    <Animated.View style={[fill, styles.layer, { opacity: fadeOut }]} {...pan.panHandlers}>
      <Image
        source={INTRO_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />

      <BlurView
        intensity={blurAmount}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <LinearGradient
        colors={[
          'rgba(5,10,22,0.78)',
          'rgba(5,10,22,0.18)',
          'rgba(5,10,22,0.40)',
          'rgba(5,10,22,0.94)',
        ]}
        locations={[0, 0.34, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.veil, { opacity: veilOpacity }]}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 26 },
        ]}
      >
        <Animated.View style={[styles.top, { opacity: titleOpacity }]}>
          {fontsLoaded ? (
            <>
              <Text style={styles.kicker}>BIENVENIDOS</Text>
              <Text style={styles.title}>Shopping</Text>
            </>
          ) : null}
        </Animated.View>

        <Animated.View style={[styles.bottom, { opacity: hintOpacity }]}>
          <Text style={styles.hint}>Haz scroll para poder acceder a tu app</Text>
          <Animated.View style={{ transform: [{ translateY: bounce }] }}>
            <Svg width={30} height={18} viewBox="0 0 30 18">
              <Polyline
                points="3,3 15,14 27,3"
                stroke={colors.text}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 5,
    color: colors.accent,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 48,
    lineHeight: 56,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
  },
  bottom: {
    alignItems: 'center',
    gap: 14,
  },
  hint: {
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.text,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  veil: {
    ...fill,
    backgroundColor: colors.bg,
  },
});
