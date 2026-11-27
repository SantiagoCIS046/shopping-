import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductImage } from '../components/ProductImage';
import { useCart } from '../context/CartContext';
import {
  generateLook,
  getLookJob,
  listLooks,
  lookUrl,
  saveLook,
  startTryOn,
  VistaGarment,
  VistaLook,
} from '../api/vista';
import { formatCOP } from '../data/products';
import { colors, radius, spacing, tabBarSpacing } from '../shop/tokens';
import { fill } from '../theme';

const OPACITIES = [1, 0.85, 0.7, 0.55];

/**
 * Módulo Vista — probador virtual con el flujo:
 * 1) Prendas del carrito → 2) fuente de la foto (galería o cámara)
 * 3) seleccionar prenda → 4) probador con gestos → 5) resultado
 * 6) guardar el look (opcional) y volver al carrito a pagar.
 */
export function VistaScreen() {
  const { items } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [garments, setGarments] = useState<VistaGarment[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Transformaciones de la prenda sobre la foto
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const lastRotate = useRef(0);
  const pinchStart = useRef<{ dist: number; scale: number; angle: number; rotate: number } | null>(null);
  const [opacityIndex, setOpacityIndex] = useState(0);

  const [resultUri, setResultUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [looks, setLooks] = useState<VistaLook[]>([]);
  const [viewingLook, setViewingLook] = useState<string | null>(null);

  const shotRef = useRef<ViewShotRef>(null);

  // Paso 1: sesión con las prendas del carrito
  const openSession = useCallback(async () => {
    if (items.length === 0) return;
    setLoadingSession(true);
    setError(null);
    try {
      const skus = [...new Set(items.map((i) => `${i.productId}--${i.size}`))];
      const session = await startTryOn(skus);
      setGarments(session.garments);
      setSessionId(session.id);
      setSelectedSku((prev) => prev ?? session.garments[0]?.sku ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos preparar el probador');
      setGarments([]);
    } finally {
      setLoadingSession(false);
    }
  }, [items]);

  useEffect(() => {
    openSession();
  }, [openSession]);

  useEffect(() => {
    listLooks()
      .then((data) => setLooks(data.looks))
      .catch(() => undefined);
  }, []);

  // Gestos: un dedo mueve, dos dedos escalan y rotan
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
          const [a, b] = [touches[0], touches[1]];
          const dx = b.pageX - a.pageX;
          const dy = b.pageY - a.pageY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          if (!pinchStart.current) {
            pinchStart.current = { dist, scale: lastScale.current, angle, rotate: lastRotate.current };
          } else {
            const nextScale = Math.min(4, Math.max(0.3, pinchStart.current.scale * (dist / pinchStart.current.dist)));
            const nextRotate = pinchStart.current.rotate + ((angle - pinchStart.current.angle) * 180) / Math.PI;
            scale.setValue(nextScale);
            rotate.setValue(nextRotate);
            lastScale.current = nextScale;
            lastRotate.current = nextRotate;
          }
        } else {
          pan.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_event, gesture) => {
        if (!pinchStart.current) {
          lastOffset.current = { x: lastOffset.current.x + gesture.dx, y: lastOffset.current.y + gesture.dy };
        }
        pinchStart.current = null;
        pan.flattenOffset();
      },
    }),
  ).current;

  const selectedGarment = garments?.find((g) => g.sku === selectedSku) ?? null;

  const pickPhoto = async (fromCamera: boolean) => {
    setError(null);
    const options = {
      mediaTypes: ['images'] as Array<'images'>,
      quality: 0.6, // foto más liviana: el envío al servidor tiene un límite de tamaño
      allowsEditing: true,
      aspect: [3, 4] as [number, number],
      base64: true,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoBase64(asset.base64 ?? null);
      setResultUri(null);
      setGeneratedUri(null);
      resetTransforms();
      // Al elegir la foto empieza la generación sola, sin tocar otro botón.
      void startGeneration(asset.base64 ?? (await uriToBase64(asset.uri)));
    }
  };

  // Generación con IA: envía la foto y las prendas del carrito, y espera el resultado.
  const startGeneration = async (base64?: string | null) => {
    const photo = base64 ?? photoBase64;
    if (!photo || !garments || garments.length === 0) {
      setError('Agrega una prenda al carrito y elige tu foto para generar el look');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const job = await generateLook(
        photo,
        garments.map((g) => g.sku),
      );
      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await getLookJob(job.jobId);
        if (status.status === 'done' && status.resultUrl) {
          setGeneratedUri(lookUrl(status.resultUrl));
          return;
        }
        if (status.status === 'failed') throw new Error(status.error ?? 'No pudimos generar el look');
      }
      throw new Error('La generación tardó demasiado, intenta de nuevo');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos generar el look';
      setError(message);
      Alert.alert('No pudimos generar tu look', message);
    } finally {
      setGenerating(false);
    }
  };

  const adjustScale = (factor: number) => {
    const next = Math.min(4, Math.max(0.3, lastScale.current * factor));
    lastScale.current = next;
    Animated.spring(scale, { toValue: next, useNativeDriver: true, friction: 7 }).start();
  };

  const adjustRotate = (delta: number) => {
    const next = lastRotate.current + delta;
    lastRotate.current = next;
    Animated.spring(rotate, { toValue: next, useNativeDriver: true, friction: 7 }).start();
  };

  function resetTransforms() {
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
    lastRotate.current = 0;
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    rotate.setValue(0);
  }

  // Paso 5: captura el look compuesto
  const captureLook = async () => {
    if (!shotRef.current) return;
    setCapturing(true);
    try {
      const base64 = await shotRef.current.capture();
      setResultUri(`data:image/jpeg;base64,${base64}`);
    } catch {
      setError('No pudimos capturar tu look, intenta de nuevo');
    } finally {
      setCapturing(false);
    }
  };

  // Paso 6: guarda el look en el backend
  const persistLook = async () => {
    if (!sessionId || !resultUri) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const base64 = resultUri.replace(/^data:image\/jpeg;base64,/, '');
      await saveLook(sessionId, base64);
      setSavedMsg('¡Look guardado! Encuéntralo en "Tus looks"');
      const data = await listLooks();
      setLooks(data.looks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar el look');
    } finally {
      setSaving(false);
    }
  };

  // ── Carrito vacío ────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <View style={styles.root}>
        <AuthBackdrop intensity={70} />
        <SafeAreaView style={styles.safe} edges={[]}>
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyText}>
              Elige las prendas que quieres probarte y vuelven a Vista.
            </Text>
            <PrimaryButton
              title="Explorar la Tienda"
              onPress={() => navigation.navigate('Main', { screen: 'Tienda' })}
              style={styles.emptyButton}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Look generado con IA ─────────────────────────────────────────
  if (generatedUri) {
    return (
      <View style={styles.root}>
        <AuthBackdrop intensity={70} />
        <SafeAreaView style={styles.safe} edges={[]}>
          <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultTitle}>Así te queda 🤩</Text>
            <Image source={{ uri: generatedUri }} style={styles.resultImage} contentFit="contain" transition={200} />
            <PrimaryButton
              title="Ir a pagar mi carrito"
              onPress={() => navigation.navigate('Main', { screen: 'Carrito' })}
            />
            <Pressable accessibilityRole="button" onPress={() => setGeneratedUri(null)} style={styles.ghostButton}>
              <Text style={styles.ghostText}>Seguir probando</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Resultado del look ───────────────────────────────────────────
  if (resultUri) {
    return (
      <View style={styles.root}>
        <AuthBackdrop intensity={70} />
        <SafeAreaView style={styles.safe} edges={[]}>
          <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultTitle}>Así te queda 🤩</Text>
            <Image source={{ uri: resultUri }} style={styles.resultImage} contentFit="contain" transition={200} />
            {savedMsg ? <Text style={styles.savedMsg}>{savedMsg}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              title={savedMsg ? 'Look guardado ✓' : 'Guardar mi look'}
              onPress={persistLook}
              loading={saving}
              disabled={!!savedMsg}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setResultUri(null)}
              style={styles.ghostButton}
            >
              <Text style={styles.ghostText}>Seguir probando</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Main', { screen: 'Carrito' })}
              style={styles.ghostButtonAccent}
            >
              <Ionicons name="cart-outline" size={17} color={colors.accent} />
              <Text style={styles.ghostTextAccent}>Ir a pagar mi carrito</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Probador ─────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Vista</Text>
          <Text style={styles.subtitle}>Pruébate lo de tu carrito antes de pagar</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Paso 4: prendas del carrito */}
          <Text style={styles.sectionLabel}>1 · Elige tu prenda</Text>
          {loadingSession ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.garmentRow}>
              {(garments ?? []).map((g) => {
                const active = g.sku === selectedSku;
                return (
                  <Pressable
                    key={g.sku}
                    accessibilityRole="button"
                    accessibilityLabel={`${g.name}, talla ${g.size}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSelectedSku(g.sku)}
                    style={styles.thumbWrap}
                  >
                    <View style={[styles.thumb, active && styles.thumbActive]}>
                      <ProductImage
                        product={{
                          id: g.sku.split('--')[0],
                          name: g.name,
                          category: g.category,
                          price: g.price,
                          sizes: [g.size],
                          image: g.image ?? null,
                        }}
                        style={styles.thumbImage}
                        contentFit="contain"
                        iconSize={20}
                      />
                      <View style={styles.thumbBadge}>
                        <Text style={styles.thumbBadgeText}>{g.size}</Text>
                      </View>
                    </View>
                    <Text style={[styles.thumbName, active && styles.thumbNameActive]} numberOfLines={1}>
                      {g.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Pasos 2-3: fuente de la foto + escenario de prueba */}
          <Text style={styles.sectionLabel}>2 · Tu foto</Text>
          {photoUri ? (
            <View>
              <ViewShot
                ref={shotRef}
                style={styles.stage}
                options={{ format: 'jpg', quality: 0.85, result: 'base64' }}
              >
                <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <Animated.View
                  {...panResponder.panHandlers}
                  accessibilityLabel="Prenda superpuesta: arrastra, pellizca y rota"
                  style={[
                    styles.garmentOverlay,
                    {
                      opacity: OPACITIES[opacityIndex],
                      transform: [...pan.getTranslateTransform(), { scale }, { rotate: `${rotate}deg` }],
                    },
                  ]}
                >
                  {selectedGarment ? (
                    selectedGarment.image ? (
                      <Image source={{ uri: selectedGarment.image }} style={styles.garmentImage} contentFit="contain" />
                    ) : (
                      <ProductImage
                        product={{
                          id: selectedGarment.sku,
                          name: selectedGarment.name,
                          category: selectedGarment.category,
                          price: selectedGarment.price,
                          sizes: [selectedGarment.size],
                          image: null,
                        }}
                        style={styles.garmentImage}
                        iconSize={34}
                      />
                    )
                  ) : (
                    <View style={styles.garmentImage} />
                  )}
                </Animated.View>
              </ViewShot>

              {/* Controles del probador */}
              <View style={styles.controls}>
                <ToolButton icon="images-outline" label="Foto" onPress={() => pickPhoto(false)} />
                <ToolButton icon="camera-outline" label="Cámara" onPress={() => pickPhoto(true)} />
                <ToolButton icon="remove-outline" label="Menor" onPress={() => adjustScale(0.87)} />
                <ToolButton icon="add-outline" label="Mayor" onPress={() => adjustScale(1.15)} />
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

              <PrimaryButton
                title={capturing ? 'Capturando…' : 'Ver mi look'}
                onPress={() => startGeneration()}
                loading={generating}
                disabled={generating || !garments || garments.length === 0}
                style={styles.lookButton}
              />
              <Text style={styles.privacyHint}>
                Tu foto vive solo en tu celular; se guarda únicamente si tú guardas el look.
              </Text>
            </View>
          ) : (
            <View style={styles.sourceRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => pickPhoto(false)}
                style={styles.sourceButton}
              >
                <Ionicons name="images-outline" size={30} color={colors.accent} />
                <Text style={styles.sourceTitle}>Galería</Text>
                <Text style={styles.sourceHint}>Sube una foto tuya</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => pickPhoto(true)}
                style={styles.sourceButton}
              >
                <Ionicons name="camera-outline" size={30} color={colors.accent} />
                <Text style={styles.sourceTitle}>Cámara</Text>
                <Text style={styles.sourceHint}>Tómate una ahora</Text>
              </Pressable>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Looks guardados */}
          {looks.length > 0 ? (
            <View style={styles.looksSection}>
              <Text style={styles.sectionLabel}>Tus looks guardados</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looksRow}>
                {looks.map((look) => (
                  <Pressable key={look.id} onPress={() => setViewingLook(lookUrl(look.imageUrl))}>
                    <Image source={{ uri: lookUrl(look.imageUrl) }} style={styles.lookThumb} contentFit="cover" transition={200} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>

        {/* Pantalla de carga: la foto del usuario con un velo gris y el loading al centro */}
        {generating ? (
          <View style={[fill, styles.genOverlay]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : null}
            <View style={styles.genShade} />
            <View style={styles.genCenter}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.genTitle}>Creando tu look…</Text>
              <Text style={styles.genHint}>Tarda entre 20 y 40 segundos</Text>
            </View>
          </View>
        ) : null}

        {/* Look a pantalla completa */}
        {viewingLook ? (
          <Pressable style={styles.lookOverlay} onPress={() => setViewingLook(null)}>
            <Image source={{ uri: viewingLook }} style={styles.lookFull} contentFit="contain" />
            <Text style={styles.lookOverlayHint}>Toca para cerrar</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/** Convierte la foto elegida a base64 (respaldo si el selector no lo entrega). */
async function uriToBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result ?? '');
      resolve(dataUrl.replace(/^data:[^,]*,/, ''));
    };
    reader.onerror = () => reject(new Error('No pudimos leer la foto'));
    reader.readAsDataURL(blob);
  });
}

function ToolButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.tool}>
      <Ionicons name={icon} size={17} color={colors.textPrimary} />
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm + 4, paddingBottom: spacing.sm },
  title: { color: colors.textPrimary, fontSize: 21, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: tabBarSpacing + spacing.xxl },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  loader: { marginVertical: 16 },
  garmentRow: { gap: spacing.sm, paddingBottom: 4 },
  thumbWrap: { width: 76, gap: 4 },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  thumbActive: { borderWidth: 2, borderColor: colors.accent },
  thumbImage: { width: '100%', height: '100%' },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    minWidth: 22,
    paddingHorizontal: 4,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(5, 10, 22, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  thumbName: { color: colors.textSecondary, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  thumbNameActive: { color: colors.textPrimary, fontWeight: '700' },
  garmentChip: {
    minWidth: 130,
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  garmentChipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  garmentName: { color: 'rgba(228, 234, 244, 0.9)', fontSize: 12.5, fontWeight: '600' },
  garmentNameActive: { color: colors.textPrimary },
  garmentMeta: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
  stage: {
    height: 400,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  garmentOverlay: {
    position: 'absolute',
    top: 110,
    left: 100,
    width: 175,
    height: 195,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    overflow: 'hidden',
  },
  garmentImage: { width: '100%', height: '100%' },
  controls: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  tool: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  toolText: { color: colors.textPrimary, fontSize: 10 },
  opacityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  opacityLabel: { color: colors.textMuted, fontSize: 11.5, marginRight: 2 },
  opacityChip: {
    height: 30,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  opacityChipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  opacityText: { color: colors.textMuted, fontSize: 11.5 },
  opacityTextActive: { color: colors.textPrimary, fontWeight: '700' },
  lookButton: { marginTop: spacing.lg },
  privacyHint: { color: colors.textMuted, fontSize: 10.5, textAlign: 'center', marginTop: spacing.sm },
  sourceRow: { flexDirection: 'row', gap: spacing.md },
  sourceButton: {
    flex: 1,
    minHeight: 150,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  sourceTitle: { color: colors.textPrimary, fontSize: 15.5, fontWeight: '700' },
  sourceHint: { color: colors.textMuted, fontSize: 11.5 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
  looksSection: { marginTop: spacing.xl },
  looksRow: { gap: spacing.sm },
  lookThumb: { width: 96, height: 128, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder },
  lookOverlay: {
    ...fill,
    backgroundColor: 'rgba(3, 6, 14, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  lookFull: { width: '92%', height: '82%' },
  genOverlay: { zIndex: 50 },
  genShade: { ...fill, backgroundColor: 'rgba(24, 24, 24, 0.62)' },
  genCenter: { ...fill, alignItems: 'center', justifyContent: 'center', gap: 10 },
  genTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  genHint: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  lookOverlayHint: { color: colors.textMuted, fontSize: 12, marginTop: 14 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 13.5, textAlign: 'center' },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
  resultContent: { paddingHorizontal: spacing.xl, paddingBottom: tabBarSpacing + spacing.xxl, paddingTop: spacing.sm },
  resultTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: spacing.lg },
  resultImage: { width: '100%', height: 430, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.glassBorder },
  savedMsg: { color: colors.success, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
  ghostButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  ghostText: { color: colors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  ghostButtonAccent: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  ghostTextAccent: { color: colors.accent, fontSize: 14.5, fontWeight: '600' },
});
