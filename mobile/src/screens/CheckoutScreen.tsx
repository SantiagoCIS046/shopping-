import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing } from '../shop/tokens';
import { formatCOP } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, CreatedOrder, DocType } from '../api/orders';
import { getPaymentLink } from '../api/payments';
import { getProfile } from '../api/profile';
import { calcTotals } from '../shop/pricing';
import { COUNTRY_CODE } from '../config';

// El pago lo procesa Wompi (PSE, Nequi, tarjeta o transferencia). La app nunca guarda datos de tarjeta.
const PAYMENT_METHOD = 'card';

const DOC_TYPES: Array<{ id: DocType; label: string }> = [
  { id: 'CC', label: 'Cédula' },
  { id: 'CE', label: 'Extranjería' },
  { id: 'NIT', label: 'NIT' },
  { id: 'PAS', label: 'Pasaporte' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  onBack: () => void;
  onDone: () => void;
};

/**
 * Checkout en acordeón, todo en una pantalla y sin recargas:
 * 1) Contacto y documento → 2) Envío → 3) Pago, con resumen colapsable arriba
 * y botón fijo que muestra el monto exacto a pagar.
 */
export function CheckoutScreen({ onBack, onDone }: Props) {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const totals = calcTotals(total);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [docType, setDocType] = useState<DocType>('CC');
  const [docNumber, setDocNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Precarga los datos guardados en el perfil: no hay que escribirlos otra vez
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((u) => {
        if (cancelled) return;
        setPhone((v) => v || u.phone || '');
        setDocType((v) => u.docType ?? v);
        setDocNumber((v) => v || u.docNumber || '');
        setCity((v) => v || u.address?.city || '');
        setAddress((v) => v || u.address?.address || '');
        setNeighborhood((v) => v || u.address?.neighborhood || '');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const continueContact = () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Escribe un correo válido para las notificaciones');
      return;
    }
    if (phone.trim().replace(/\D/g, '').length < 7) {
      setError('Escribe un teléfono de contacto');
      return;
    }
    if (!/^[0-9A-Za-z]{5,20}$/.test(docNumber.trim().replace(/[\s.-]/g, ''))) {
      setError('Escribe tu número de documento (sin puntos ni espacios)');
      return;
    }
    setStep(2);
  };

  const continueShipping = () => {
    setError(null);
    if (city.trim().length < 3) {
      setError('Escribe tu ciudad');
      return;
    }
    if (address.trim().length < 5) {
      setError('Escribe la dirección de entrega');
      return;
    }
    if (neighborhood.trim().length < 3) {
      setError('Escribe el barrio');
      return;
    }
    setStep(3);
  };

  const pay = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y las políticas para pagar');
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder({
        paymentMethod: PAYMENT_METHOD,
        country: COUNTRY_CODE,
        customerEmail: email.trim(),
        phone: phone.trim(),
        customerDocType: docType,
        customerDocNumber: docNumber.trim().replace(/[\s.-]/g, ''),
        shippingAddress: {
          city: city.trim(),
          address: address.trim(),
          neighborhood: neighborhood.trim(),
        },
        items: items.map((i) => ({
          sku: `${i.productId}--${i.size}`,
          quantity: i.quantity,
        })),
      });
      clear();
      setCreated(order);

      // Abre la pasarela de Wompi con el monto exacto del pedido
      try {
        const { url } = await getPaymentLink(order.orderNumber);
        await Linking.openURL(url);
      } catch {
        setPaymentError(
          'Tu pedido quedó creado, pero no pudimos abrir el pago. Entra a Perfil › Mis pedidos para intentarlo de nuevo.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear el pedido');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={60} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.title}>Pago</Text>
          <View style={styles.spacer} />
        </View>

        {created ? (
          <View style={styles.successWrap}>
            <GlassCard style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={34} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>¡Pedido creado!</Text>
              <Text style={styles.successText}>
                Número <Text style={styles.successId}>#{created.orderNumber}</Text>
                {'\n'}Total a pagar: {formatCOP(created.total)}
                {'\n\n'}
                {paymentError
                  ? paymentError
                  : 'Completa el pago en la ventana de Wompi. Cuando se confirme, te llegará un correo con tu factura.'}
              </Text>
              <PrimaryButton title="Volver a la tienda" onPress={onDone} />
            </GlassCard>
          </View>
        ) : (
          <>
            {/* Resumen colapsable */}
            <View style={styles.content}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSummaryOpen((v) => !v)}
                style={styles.summaryToggle}
              >
                <Ionicons
                  name={summaryOpen ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={styles.summaryToggleText}>
                  {summaryOpen
                    ? 'Ocultar resumen'
                    : `Ver resumen de compra (${items.length} artículo${items.length === 1 ? '' : 's'}) — ${formatCOP(totals.total)}`}
                </Text>
              </Pressable>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {summaryOpen ? (
                  <GlassCard style={styles.summaryCard}>
                    {items.map((i) => (
                      <View key={`${i.productId}-${i.size}`} style={styles.line}>
                        <Text style={styles.lineText} numberOfLines={1}>
                          {i.name} ({i.size}) × {i.quantity}
                        </Text>
                        <Text style={styles.lineText}>{formatCOP(i.price * i.quantity)}</Text>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.line}>
                      <Text style={styles.lineDim}>Subtotal</Text>
                      <Text style={styles.lineText}>{formatCOP(total)}</Text>
                    </View>
                    <View style={styles.line}>
                      <Text style={styles.lineDim}>{totals.taxLabel}</Text>
                      <Text style={styles.lineText}>{formatCOP(totals.taxAmount)}</Text>
                    </View>
                    <View style={styles.line}>
                      <Text style={styles.lineDim}>Envío</Text>
                      <Text style={styles.lineText}>
                        {totals.freeShipping ? 'Gratis' : formatCOP(totals.shipping)}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.line}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>{formatCOP(totals.total)}</Text>
                    </View>
                  </GlassCard>
                ) : null}

                {/* Paso 1: Contacto y documento */}
                <GlassCard style={styles.stepCard}>
                  <StepHeader
                    n={1}
                    title="Contacto"
                    done={step > 1}
                    open={step === 1}
                    onPress={() => setStep(1)}
                  />
                  {step === 1 ? (
                    <View style={styles.stepBody}>
                      <GlassInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Correo para notificaciones"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        style={styles.field}
                      />
                      <GlassInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Teléfono de contacto"
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                        style={styles.field}
                      />
                      <Text style={styles.label}>Documento para tu factura</Text>
                      <View style={styles.docRow}>
                        {DOC_TYPES.map((d) => {
                          const active = docType === d.id;
                          return (
                            <Pressable
                              key={d.id}
                              accessibilityRole="radio"
                              accessibilityState={{ selected: active }}
                              onPress={() => setDocType(d.id)}
                              style={[styles.docChip, active && styles.docChipActive]}
                            >
                              <Text style={[styles.docChipText, active && styles.docChipTextActive]}>{d.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <GlassInput
                        value={docNumber}
                        onChangeText={setDocNumber}
                        placeholder="Número de documento"
                        keyboardType="default"
                        autoCapitalize="characters"
                        style={styles.field}
                      />
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <PrimaryButton title="Continuar" onPress={continueContact} />
                    </View>
                  ) : (
                    <Text style={styles.stepDone} numberOfLines={1}>
                      {email.trim()} · {phone.trim()} · {docType} {docNumber.trim()}
                    </Text>
                  )}
                </GlassCard>

                {/* Paso 2: Envío */}
                <GlassCard style={styles.stepCard}>
                  <StepHeader
                    n={2}
                    title="Envío"
                    done={step > 2}
                    open={step === 2}
                    onPress={() => (step > 1 ? setStep(2) : undefined)}
                  />
                  {step === 2 ? (
                    <View style={styles.stepBody}>
                      <GlassInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ciudad"
                        autoCapitalize="words"
                        textContentType="addressCity"
                        style={styles.field}
                      />
                      <GlassInput
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Dirección de entrega"
                        autoCapitalize="words"
                        textContentType="streetAddressLine1"
                        style={styles.field}
                      />
                      <GlassInput
                        value={neighborhood}
                        onChangeText={setNeighborhood}
                        placeholder="Barrio"
                        autoCapitalize="words"
                        style={styles.field}
                        onSubmitEditing={continueShipping}
                        returnKeyType="done"
                      />
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <PrimaryButton title="Continuar" onPress={continueShipping} />
                    </View>
                  ) : step > 2 ? (
                    <Text style={styles.stepDone} numberOfLines={1}>
                      {city.trim()}, {address.trim()} — {neighborhood.trim()}
                    </Text>
                  ) : (
                    <Text style={styles.stepPending}>Completa tu contacto primero</Text>
                  )}
                </GlassCard>

                {/* Paso 3: Pago */}
                <GlassCard style={styles.stepCard}>
                  <StepHeader n={3} title="Pago" done={false} open={step === 3} onPress={() => undefined} />
                  {step === 3 ? (
                    <View style={styles.stepBody}>
                      <Text style={styles.payText}>
                        Pagarás de forma segura con Wompi: PSE, Nequi, tarjeta o transferencia. Elige el medio de pago en su ventana.
                      </Text>
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: acceptedTerms }}
                        onPress={() => setAcceptedTerms((v) => !v)}
                        style={styles.acceptRow}
                      >
                        <Ionicons
                          name={acceptedTerms ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={acceptedTerms ? colors.accent : colors.textMuted}
                        />
                        <Text style={styles.acceptText}>
                          Acepto los{' '}
                          <Text
                            style={styles.acceptLink}
                            onPress={() => navigation.navigate('Legal')}
                          >
                            términos y condiciones
                          </Text>
                          , la política de cambios y el tratamiento de mis datos.
                        </Text>
                      </Pressable>
                      <View style={styles.notice}>
                        <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
                        <Text style={styles.noticeText}>
                          La app nunca guarda tus datos de tarjeta; los procesa la pasarela.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.stepPending}>Completa contacto y envío primero</Text>
                  )}
                </GlassCard>
              </ScrollView>
            </View>

            {/* Botón de pago fijo con el monto exacto */}
            <View style={styles.footer}>
              <PrimaryButton
                title={`Pagar ${formatCOP(totals.total)}`}
                onPress={pay}
                loading={placing}
                disabled={items.length === 0 || step !== 3 || !acceptedTerms}
              />
              <Text style={styles.footerSecurity}>Transacción segura · Shopping</Text>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function StepHeader({
  n,
  title,
  done,
  open,
  onPress,
}: {
  n: number;
  title: string;
  done: boolean;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.stepHeader}>
      <View style={[styles.stepNumber, done && styles.stepNumberDone, open && styles.stepNumberOpen]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color="#0B1733" />
        ) : (
          <Text style={styles.stepNumberText}>{n}</Text>
        )}
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Ionicons
        name={open ? 'chevron-up' : 'chevron-down'}
        size={15}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  spacer: { width: 60 },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  summaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
  },
  summaryToggleText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  summaryCard: { marginBottom: spacing.md },
  stepCard: { marginBottom: spacing.md },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberOpen: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  stepNumberDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepNumberText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '700' },
  stepTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  stepBody: { marginTop: spacing.md, gap: 0 },
  stepDone: { color: colors.textMuted, fontSize: 12.5, marginTop: 6 },
  stepPending: { color: colors.textMuted, fontSize: 12.5, marginTop: 6 },
  field: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: 12.5, marginBottom: 6 },
  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  docChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docChipActive: { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  docChipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  docChipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  payText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  error: {
    color: colors.danger,
    fontSize: 13.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  acceptText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  acceptLink: { color: colors.accent, textDecorationLine: 'underline' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginTop: spacing.xs,
  },
  noticeText: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineText: { color: colors.textPrimary, fontSize: 14, flexShrink: 1 },
  lineDim: { color: colors.textSecondary, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.sm },
  totalLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  footerSecurity: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  successWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  successCard: { alignItems: 'center', gap: spacing.md },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 214, 140, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(61, 214, 140, 0.45)',
  },
  successTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  successText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  successId: { color: colors.accent, fontWeight: '700' },
});
