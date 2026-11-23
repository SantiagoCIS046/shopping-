import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';
import { PrimaryButton } from './PrimaryButton';
import { formatCOP } from '../data/products';
import { listAdminOrders, shipOrder, AdminOrder } from '../api/admin';
import { colors, radius, spacing } from '../shop/tokens';

const FILTERS: Array<{ id: string; label: string }> = [
  { id: 'pagado', label: 'Para empacar' },
  { id: 'enviado', label: 'Enviados' },
  { id: '', label: 'Todos' },
];

/**
 * Panel administrativo (solo visible para correos en ADMIN_EMAILS):
 * pedidos por estado y despacho con transportadora + guía,
 * que dispara el correo de rastreo al cliente.
 */
export function AdminPanel() {
  const [status, setStatus] = useState('pagado');
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [carrier, setCarrier] = useState('');
  const [guide, setGuide] = useState('');
  const [shipping, setShipping] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminOrders(status || undefined);
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar los pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const submitShip = async (orderNumber: string) => {
    setError(null);
    if (carrier.trim().length < 2) {
      setError('Escribe la transportadora');
      return;
    }
    if (guide.trim().length < 4) {
      setError('Escribe el número de guía');
      return;
    }
    setShipping(true);
    try {
      await shipOrder(orderNumber, carrier.trim(), guide.trim());
      setExpanded(null);
      setCarrier('');
      setGuide('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos marcar el envío');
    } finally {
      setShipping(false);
    }
  };

  return (
    <GlassCard>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={17} color={colors.accent} />
        <Text style={styles.title}>Panel de administración</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityState={{ selected: status === f.id }}
            onPress={() => setStatus(f.id)}
            style={[styles.chip, status === f.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, status === f.id && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {orders !== null && orders.length === 0 && !loading ? (
        <Text style={styles.muted}>No hay pedidos con este estado.</Text>
      ) : null}

      {orders?.map((order) => {
        const open = expanded === order.orderNumber;
        return (
          <View key={order.id} style={styles.order}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setExpanded(open ? null : order.orderNumber);
                setError(null);
              }}
              style={styles.orderRow}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>#{order.orderNumber}</Text>
                <Text style={styles.orderMeta} numberOfLines={1}>
                  {order.customerEmail ?? ''} ·{' '}
                  {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} ·{' '}
                  {order.items.reduce((n, i) => n + i.quantity, 0)} uds
                </Text>
              </View>
              <Text style={styles.orderTotal}>{formatCOP(order.total)}</Text>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={colors.textMuted}
              />
            </Pressable>

            {open ? (
              order.status === 'pagado' ? (
                <View style={styles.shipForm}>
                  <GlassInput
                    value={carrier}
                    onChangeText={setCarrier}
                    placeholder="Transportadora (Servientrega, Coordinadora…)"
                    autoCapitalize="words"
                    style={styles.field}
                  />
                  <GlassInput
                    value={guide}
                    onChangeText={setGuide}
                    placeholder="Número de guía"
                    autoCapitalize="characters"
                    style={styles.field}
                    onSubmitEditing={() => submitShip(order.orderNumber)}
                    returnKeyType="done"
                  />
                  <PrimaryButton
                    title="Marcar como enviado"
                    onPress={() => submitShip(order.orderNumber)}
                    loading={shipping}
                  />
                  <Text style={styles.shipHint}>
                    Se enviará un correo al cliente con su guía de rastreo.
                  </Text>
                </View>
              ) : (
                <Text style={styles.shippedInfo}>
                  {order.carrier
                    ? `${order.carrier} · Guía ${order.trackingNumber}`
                    : `Estado: ${order.status}`}
                </Text>
              )
            ) : null}
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    height: 32,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  chipActive: { borderColor: colors.accentBorder, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: colors.textPrimary, fontWeight: '600' },
  loader: { marginVertical: spacing.md },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm, textAlign: 'center' },
  muted: { color: colors.textMuted, fontSize: 13.5 },
  order: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderInfo: { flex: 1 },
  orderId: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  orderMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  orderTotal: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  shipForm: { marginTop: spacing.md },
  field: { marginBottom: spacing.md },
  shipHint: { color: colors.textMuted, fontSize: 11.5, textAlign: 'center', marginTop: spacing.sm },
  shippedInfo: { color: colors.textSecondary, fontSize: 12.5, marginTop: spacing.sm },
});
