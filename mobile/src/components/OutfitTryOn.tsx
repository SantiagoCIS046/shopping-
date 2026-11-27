import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { detectGarmentLayout, GarmentLayout } from '../vista/detectPose';
import { GarmentSlot, rectToPixels } from '../vista/poseLayout';
import { formatCOP, Product, PRODUCT_LOCAL_IMAGES, products } from '../data/products';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../shop/tokens';

const SLOT_CATEGORIES: Record<GarmentSlot, { label: string; categories: string[] }> = {
  top: {
    label: 'Camisa',
    categories: ['camisetas', 'polos', 'oversize', 'camisas-vestir', 'buzos', 'sudaderas', 'deportiva'],
  },
  bottom: { label: 'Pantalón', categories: ['jeans'] },
  shoes: { label: 'Zapatos', categories: ['zapatos'] },
};

// Si no se detecta la postura, las prendas quedan en posiciones típicas para ajustar a mano.
const FALLBACK_LAYOUT: GarmentLayout = {
  top: { cx: 0.5, cy: 0.33, width: 0.5, height: 0.28 },
  bottom: { cx: 0.5, cy: 0.66, width: 0.42, height: 0.3 },
  shoes: { cx: 0.5, cy: 0.93, width: 0.4, height: 0.12 },
};

type Selection = Partial<Record<GarmentSlot, Product>>;

export function OutfitTryOn({ initial }: { initial: Product }) {
  const { add } = useCart();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(() => {
    const slot = slotOf(initial);
    return slot ? { [slot]: initial } : {};
  });
  const [layout, setLayout] = useState<GarmentLayout>(FALLBACK_LAYOUT);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'auto' | 'manual'>('idle');
  const [stageWidth, setStageWidth] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const shotRef = React.useRef<ViewShotRef>(null);

  const stageHeight = stageWidth * (4 / 3);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setResultUri(null);
    setStatus('detecting');
    const detected = await detectGarmentLayout(uri);
    if (detected) {
      setLayout({ ...FALLBACK_LAYOUT, ...detected });
      setStatus('auto');
    } else {
      setLayout(FALLBACK_LAYOUT);
      setStatus('manual');
    }
  }

  function choose(slot: GarmentSlot, product: Product) {
    setSelection((prev) => ({ ...prev, [slot]: prev[slot]?.id === product.id ? undefined : product }));
  }

  async function capture() {
    if (!shotRef.current) return;
    setCapturing(true);
    try {
      const base64 = await shotRef.current.capture();
      setResultUri(`data:image/jpeg;base64,${base64}`);
    } finally {
      setCapturing(false);
    }
  }

  const chosen = (Object.values(selection) as Product[]).filter(Boolean);

  return (
    <View style={styles.wrap}>
      {/* Lienzo: la foto del usuario con las prendas seleccionadas colocadas en su cuerpo */}
      <View style={styles.stageWrap} onLayout={(e) => setStageWidth(e.nativeEvent.layout.width)}>
        {resultUri ? (
          <Image source={{ uri: resultUri }} style={styles.stage} contentFit="contain" />
        ) : photoUri ? (
          <ViewShot ref={shotRef} style={styles.stage} options={{ format: 'jpg', quality: 0.9, result: 'base64' }}>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {(Object.keys(SLOT_CATEGORIES) as GarmentSlot[]).map((slot) => {
              const product = selection[slot];
              const rect = layout[slot];
              if (!product || !rect || stageWidth === 0) return null;
              const box = rectToPixels(rect, stageWidth, stageHeight);
              const source = PRODUCT_LOCAL_IMAGES[product.id];
              return (
                <Image
                  key={slot}
                  source={source ?? { uri: product.image ?? undefined }}
                  style={[styles.garment, { left: box.left, top: box.top, width: box.width, height: box.height }]}
                  contentFit="contain"
                />
              );
            })}
          </ViewShot>
        ) : (
          <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.stage}>
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={36} color={colors.textPrimary} />
              <Text style={styles.emptyTitle}>Sube una foto de cuerpo completo</Text>
              <Text style={styles.emptyHint}>Toca aquí para elegir tu foto</Text>
            </View>
          </Pressable>
        )}
        {status === 'detecting' ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={styles.busyText}>Detectando tu postura…</Text>
          </View>
        ) : null}
      </View>

      {status === 'manual' ? (
        <Text style={styles.note}>No pudimos detectar tu postura. Usa una foto de cuerpo completo y bien iluminada.</Text>
      ) : null}

      {photoUri && !resultUri ? (
        <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.changePhoto}>
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </Pressable>
      ) : null}

      {/* Selección de prendas por parte del cuerpo */}
      {(Object.keys(SLOT_CATEGORIES) as GarmentSlot[]).map((slot) => {
        const options = products.filter((p) => SLOT_CATEGORIES[slot].categories.includes(p.category));
        return (
          <View key={slot} style={styles.slot}>
            <Text style={styles.slotLabel}>{SLOT_CATEGORIES[slot].label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
              {options.map((p) => {
                const active = selection[slot]?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => choose(slot, p)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={styles.optionName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.optionPrice}>{formatCOP(p.price)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}

      {photoUri && !resultUri ? (
        <PrimaryButton
          title={capturing ? 'Generando…' : 'Ver mi look'}
          onPress={capture}
          loading={capturing}
          disabled={chosen.length === 0}
        />
      ) : null}

      {resultUri ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Agregar el look al carrito"
            onPress={() => chosen.forEach((p) => add({ productId: p.id, name: p.name, price: p.price, size: p.sizes[1] ?? p.sizes[0] }))}
          />
          <Pressable accessibilityRole="button" onPress={() => setResultUri(null)} style={styles.ghost}>
            <Text style={styles.ghostText}>Cambiar prendas</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function slotOf(product: Product): GarmentSlot | null {
  for (const slot of Object.keys(SLOT_CATEGORIES) as GarmentSlot[]) {
    if (SLOT_CATEGORIES[slot].categories.includes(product.category)) return slot;
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  stageWrap: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  stage: { width: '100%', height: '100%', backgroundColor: '#FFFFFF' },
  garment: { position: 'absolute' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#4A4A4A', fontSize: 13, fontWeight: '500' },
  busy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  busyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  note: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  changePhoto: { alignSelf: 'center', paddingVertical: 8 },
  changePhotoText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  slot: { gap: 6 },
  slotLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  slotRow: { gap: spacing.sm, paddingRight: spacing.md },
  option: {
    width: 140,
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  optionActive: { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  optionName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  optionPrice: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  actions: { gap: spacing.sm },
  ghost: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
