import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UrbanBackground } from '../components/UrbanBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing } from '../theme/tokens';
import { formatCOP } from '../data/products';
import { useCart } from '../context/CartContext';

// Métodos de pago: la tarjeta se procesa en una pasarela (Wompi, ePayco o Mercado Pago),
// nunca guardamos datos de tarjeta en la app.
const paymentMethods = [
  { id: 'transfer', label: 'Transferencia bancaria', hint: 'Confirma al recibir' },
  { id: 'pse', label: 'PSE', hint: 'Débito desde tu banco' },
  { id: 'nequi', label: 'Nequi', hint: 'Desde tu app' },
  { id: 'card', label: 'Tarjeta de crédito o débito', hint: 'Pasarela segura' },
] as const;

type Props = {
  onBack: () => void;
  onConfirm: (methodId: string) => void;
};

export function CheckoutScreen({ onBack, onConfirm }: Props) {
  const { items, total } = useCart();
  const [method, setMethod] = useState<(typeof paymentMethods)[number]['id']>('transfer');

  return (
    <View style={styles.root}>
      <UrbanBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <PrimaryButton label="Volver" variant="ghost" onPress={onBack} style={styles.back} />
          <Text style={styles.title}>Pago</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard>
            <Text style={styles.sectionLabel}>Resumen</Text>
            {items.length === 0 ? (
              <Text style={styles.muted}>Tu carrito está vacío</Text>
            ) : (
              items.map((i) => (
                <View key={`${i.productId}-${i.size}`} style={styles.line}>
                  <Text style={styles.lineText}>
                    {i.name} ({i.size}) × {i.quantity}
                  </Text>
                  <Text style={styles.lineText}>{formatCOP(i.price * i.quantity)}</Text>
                </View>
              ))
            )}
            <View style={styles.divider} />
            <View style={styles.line}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCOP(total)}</Text>
            </View>
          </GlassCard>

          <Text style={styles.sectionLabel}>Método de pago</Text>
          {paymentMethods.map((m) => {
            const selected = m.id === method;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setMethod(m.id)}
                style={[styles.method, selected && styles.methodActive]}
              >
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodHint}>{m.hint}</Text>
              </Pressable>
            );
          })}

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Tu pedido queda en espera hasta confirmar el pago. [TEXTO LEGAL PENDIENTE]
            </Text>
          </View>
        </ScrollView>

        <GlassCard style={styles.footer} intensity={40}>
          <PrimaryButton
            label="Confirmar pedido"
            disabled={items.length === 0}
            onPress={() => onConfirm(method)}
          />
        </GlassCard>
      </SafeAreaView>
    </View>
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
  back: { minHeight: 44, paddingHorizontal: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  spacer: { width: 80 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 24, gap: spacing.md },
  sectionLabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 14 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineText: { color: colors.textPrimary, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.sm },
  totalLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  totalValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  method: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  methodActive: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  methodLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  methodHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  notice: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  noticeText: { color: colors.textSecondary, fontSize: 12 },
  footer: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
