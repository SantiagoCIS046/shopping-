import React, { useRef, useState } from 'react';
import { Animated, Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../theme/tokens';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  garmentUri: string;
};

// Probador fase 1: foto del usuario + prenda superpuesta que se puede mover y escalar.
// Fase 2 (después): ajustar la prenda con detección de pose (ML Kit o similar).
export function TryOnCanvas({ garmentUri }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Posición y escala de la prenda, animadas para que se sienta fluido.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: lastOffset.current.x, y: lastOffset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        lastOffset.current = { x: lastOffset.current.x + g.dx, y: lastOffset.current.y + g.dy };
        pan.flattenOffset();
      },
    }),
  ).current;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  function resize(factor: number) {
    Animated.spring(scale, { toValue: factor, useNativeDriver: true, friction: 7 }).start();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sube una foto para probarte la prenda</Text>
          </View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          accessibilityLabel="Prenda superpuesta, arrastra para mover"
          style={[
            styles.garment,
            { transform: [...pan.getTranslateTransform(), { scale }] },
          ]}
        >
          <Image source={{ uri: garmentUri }} style={styles.garmentImage} resizeMode="contain" />
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <PrimaryButton label="Subir foto" variant="ghost" onPress={pickPhoto} style={styles.flex} />
        <PrimaryButton label="Más grande" variant="ghost" onPress={() => resize(1.15)} style={styles.flex} />
        <PrimaryButton label="Más chica" variant="ghost" onPress={() => resize(0.87)} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  stage: {
    height: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  garment: {
    position: 'absolute',
    top: 70,
    left: 110,
    width: 170,
    height: 190,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(160,190,255,0.3)',
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
    minHeight: 44,
  },
});
