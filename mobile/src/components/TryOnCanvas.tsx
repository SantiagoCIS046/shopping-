import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../data/products';
import { ProductImage } from './ProductImage';
import { colors, radius, spacing } from '../shop/tokens';
import { fill } from '../theme';

/**
 * Módulo "Vista" (probador): el usuario sube su foto y la prenda elegida
 * se superpone. Se arrastra con un dedo y con dos dedos se escala
 * (pellizco) y se rota, para moldearla al cuerpo de la foto.
 */
export function TryOnCanvas({ product }: { product: Product }) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [opacityIndex, setOpacityIndex] = useState(0); // 1, 0.85, 0.7, 0.55

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const lastRotate = useRef(0);
  const pinchStart = useRef<{ dist: number; scale: number; angle: number; rotate: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        pan.setOffset({ x: lastOffset.current.x, y: lastOffset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (event, gesture) => {
        const touches = event.nativeEvent.touches;
        if (touches.length >= 2) {
          // Dos dedos: pellizco para escalar + rotación
          const [a, b] = [touches[0], touches[1]];
          const dx = b.pageX - a.pageX;
          const dy = b.pageY - a.pageY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          if (!pinchStart.current) {
            pinchStart.current = { dist, scale: lastScale.current, angle, rotate: lastRotate.current };
          } else {
            const factor = dist / pinchStart.current.dist;
            const nextScale = Math.min(4, Math.max(0.3, pinchStart.current.scale * factor));
            const deltaRad = angle - pinchStart.current.angle;
            const nextRotate = pinchStart.current.rotate + (deltaRad * 180) / Math.PI;
            scale.setValue(nextScale);
            rotate.setValue(nextRotate);
            lastScale.current = nextScale;
            lastRotate.current = nextRotate;
          }
        } else {
          // Un dedo: mover la prenda
          pan.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },

      onPanResponderRelease: (_event, gesture) => {
        if (!pinchStart.current) {
          lastOffset.current = {
            x: lastOffset.current.x + gesture.dx,
            y: lastOffset.current.y + gesture.dy,
          };
        }
        pinchStart.current = null;
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

  function adjustScale(factor: number) {
    const next = Math.min(4, Math.max(0.3, lastScale.current * factor));
    lastScale.current = next;
    Animated.spring(scale, { toValue: next, useNativeDriver: true, friction: 7 }).start();
  }

  function adjustRotate(delta: number) {
    const next = lastRotate.current + delta;
    lastRotate.current = next;
    Animated.spring(rotate, { toValue: next, useNativeDriver: true, friction: 7 }).start();
  }

  function resetTransforms() {
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
    lastRotate.current = 0;
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    rotate.setValue(0);
  }

  const OPACITIES = [1, 0.85, 0.7, 0.55];

  return (
    <View style={styles.wrap}>
      <View style={styles.stage} {...panResponder.panHandlers}>
        {photoUri ? (
          <Animated.Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={40} color="rgba(230, 236, 246, 0.75)" />
            <Text style={styles.emptyText}>Sube tu foto para probarte la prenda</Text>
            <Text style={styles.emptyHint}>Arrastra la prenda con un dedo · pellizca con dos para escalar y rotar</Text>
          </View>
        )}

        <Animated.View
          accessibilityLabel="Prenda superpuesta: arrastra, pellizca y rota"
          style={[
            styles.garment,
            {
              opacity: OPACITIES[opacityIndex],
              transform: [
                ...pan.getTranslateTransform(),
                { scale },
                { rotate: `${rotate}deg` },
              ],
            },
          ]}
        >
          <ProductImage product={product} style={styles.garmentImage} iconSize={38} />
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <ToolButton icon="image-outline" label="Tu foto" onPress={pickPhoto} />
        <ToolButton icon="remove-outline" label="Chica" onPress={() => adjustScale(0.87)} />
        <ToolButton icon="add-outline" label="Grande" onPress={() => adjustScale(1.15)} />
        <ToolButton icon="sync-outline" label="Rotar" onPress={() => adjustRotate(15)} />
        <ToolButton icon="refresh-outline" label="Reiniciar" onPress={resetTransforms} />
      </View>

      <View style={styles.opacityRow}>
        <Text style={styles.opacityLabel}>Opacidad</Text>
        {OPACITIES.map((value, index) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`Opacidad ${Math.round(value * 100)}%`}
            accessibilityState={{ selected: opacityIndex === index }}
            onPress={() => setOpacityIndex(index)}
            style={[styles.opacityChip, opacityIndex === index && styles.opacityChipActive]}
          >
            <Text style={[styles.opacityText, opacityIndex === index && styles.opacityTextActive]}>
              {Math.round(value * 100)}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ToolButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.tool}>
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  stage: {
    height: 360,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  empty: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  garment: {
    position: 'absolute',
    top: 70,
    left: 105,
    width: 170,
    height: 190,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    overflow: 'hidden',
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tool: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 11,
  },
  opacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  opacityLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginRight: 2,
  },
  opacityChip: {
    height: 32,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  opacityChipActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  opacityText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  opacityTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
