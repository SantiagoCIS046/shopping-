import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { AdminPanel } from '../components/AdminPanel';
import { GlassInput } from '../components/GlassInput';
import { SecureGlassInput } from '../components/SecureGlassInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { listOrders, OrderHistoryItem } from '../api/orders';
import { getPaymentLink } from '../api/payments';
import { SavedDataCard } from '../components/SavedDataCard';
import { Linking } from 'react-native';
import { formatCOP } from '../data/products';
import { colors, radius, spacing, tabBarSpacing } from '../shop/tokens';

const STATUS_LABEL: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/**
 * Perfil del usuario: sus datos, historial de pedidos reales,
 * edición de nombre y contraseña, y cierre de sesión.
 */
export function ProfileScreen({ onSignedOut }: { onSignedOut: () => void }) {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [orders, setOrders] = useState<OrderHistoryItem[] | null>(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await listOrders();
      setOrders(data.orders);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const saveName = async () => {
    setProfileMsg(null);
    if (name.trim().length < 2) {
      setProfileMsg('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setSavingName(true);
    try {
      await api('/auth/profile', { method: 'PATCH', body: { name: name.trim() } });
      setProfileMsg('Nombre actualizado ✓');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'No pudimos guardar el nombre');
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 8 || newPassword.length > 64) {
      setPasswordMsg('La nueva contraseña debe tener entre 8 y 64 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Las contraseñas nuevas no coinciden');
      return;
    }
    setSavingPassword(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setPasswordMsg('Contraseña actualizada ✓ Vuelve a iniciar sesión.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'No pudimos cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cabecera del usuario */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name ?? ''}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>

          {/* Mis pedidos */}
          <GlassCard>
            <SectionTitle
              icon="receipt-outline"
              label="Mis pedidos"
              badge={orders ? String(orders.length) : undefined}
              open={ordersOpen}
              onToggle={() => setOrdersOpen((v) => !v)}
            />
            {ordersOpen ? (
              orders === null ? (
                <ActivityIndicator color={colors.accent} style={styles.loader} />
              ) : orders.length === 0 ? (
                <Text style={styles.muted}>Todavía no tienes pedidos.</Text>
              ) : (
                orders.map((order) => {
                  const open = expandedOrder === order.id;
                  return (
                    <View key={order.id} style={styles.order}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Pedido ${order.id}`}
                        onPress={() => setExpandedOrder(open ? null : order.id)}
                        style={styles.orderRow}
                      >
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderId}>#{order.orderNumber}</Text>
                          <Text style={styles.orderMeta}>
                            {new Date(order.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {STATUS_LABEL[order.status] ?? order.status}
                          </Text>
                        </View>
                        <Text style={styles.orderTotal}>{formatCOP(order.total)}</Text>
                        <Ionicons
                          name={open ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textMuted}
                        />
                      </Pressable>
                      {order.status === 'pendiente_pago' ? <PayAgainButton orderNumber={order.orderNumber} /> : null}
                      {open ? (
                        <View style={styles.orderItems}>
                          {order.items.map((item) => (
                            <Text key={item.id} style={styles.orderItem}>
                              {item.name ?? item.productId} · Talla {item.size} × {item.quantity} —{' '}
                              {formatCOP(item.unitPrice * item.quantity)}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )
            ) : null}
          </GlassCard>

          {/* Datos de la cuenta */}
          <GlassCard>
            <SectionTitle icon="person-outline" label="Mis datos" />
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
              autoCapitalize="words"
              textContentType="name"
              style={styles.field}
            />
            <GlassInput
              value={user?.email ?? ''}
              editable={false}
              placeholder="Correo"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.fieldDisabled}
            />
            {profileMsg ? <Text style={styles.feedback}>{profileMsg}</Text> : null}
            <PrimaryButton title="Guardar nombre" onPress={saveName} loading={savingName} />
          </GlassCard>

          {/* Cambio de contraseña */}
          <GlassCard>
            <SectionTitle icon="lock-closed-outline" label="Cambiar contraseña" />
            <SecureGlassInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              textContentType="password"
              style={styles.field}
            />
            <SecureGlassInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Contraseña nueva"
              textContentType="newPassword"
              style={styles.field}
            />
            <SecureGlassInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar contraseña nueva"
              textContentType="newPassword"
              style={styles.field}
              onSubmitEditing={changePassword}
              returnKeyType="done"
            />
            {passwordMsg ? <Text style={styles.feedback}>{passwordMsg}</Text> : null}
            <PrimaryButton title="Actualizar contraseña" onPress={changePassword} loading={savingPassword} />
          </GlassCard>

          {/* Panel de administración (solo ADMIN_EMAILS) */}
          {user?.isAdmin ? <AdminPanel /> : null}

          {/* Datos de pago y envío: se reutilizan en el checkout */}
          <SavedDataCard />

          {/* Legal */}
          <GlassCard>
            <SectionTitle icon="document-text-outline" label="Legal y políticas" />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Legal')}
              style={styles.comingRow}
            >
              <Ionicons name="swap-horizontal-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.comingLabel}>Cambios, devoluciones y garantías</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
            <View style={styles.comingDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Legal')}
              style={styles.comingRow}
            >
              <Ionicons name="lock-closed-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.comingLabel}>Tratamiento de datos (Ley 1581)</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
            <View style={styles.comingDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Legal')}
              style={styles.comingRow}
            >
              <Ionicons name="document-text-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.comingLabel}>Términos y condiciones</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          </GlassCard>

          {/* Próximamente */}
          <GlassCard>
            <ComingRow icon="location-outline" label="Direcciones guardadas" />
            <View style={styles.comingDivider} />
            <ComingRow icon="heart-outline" label="Lista de deseos" />
          </GlassCard>

          {/* Cerrar sesión */}
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await signOut();
              onSignedOut();
            }}
            style={styles.signOut}
          >
            <Ionicons name="log-out-outline" size={19} color={colors.danger} />
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Genera un enlace de pago NUEVO para un pedido pendiente (cada enlace sirve para un solo intento). */
function PayAgainButton({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const payAgain = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { url } = await getPaymentLink(orderNumber);
      await Linking.openURL(url);
    } catch {
      setMsg('No pudimos abrir el pago. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.payAgainWrap}>
      <PrimaryButton title="Pagar este pedido" onPress={payAgain} loading={busy} />
      {msg ? <Text style={styles.feedback}>{msg}</Text> : null}
    </View>
  );
}

function SectionTitle({
  icon,
  label,
  badge,
  open,
  onToggle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  badge?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onToggle ? 'button' : undefined}
      onPress={onToggle}
      disabled={!onToggle}
      style={styles.sectionTitle}
    >
      <Ionicons name={icon} size={17} color={colors.textSecondary} />
      <Text style={styles.sectionTitleText}>{label}</Text>
      {badge ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {onToggle ? (
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

function ComingRow({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.comingRow}>
      <Ionicons name={icon} size={17} color={colors.textSecondary} />
      <Text style={styles.comingLabel}>{label}</Text>
      <Text style={styles.comingHint}>Próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: tabBarSpacing + spacing.xxl, gap: spacing.md },
  header: { alignItems: 'center', paddingVertical: spacing.xl, gap: 6 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { fontSize: 30, color: colors.accent, fontWeight: '600' },
  onlineDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 13.5 },
  loader: { marginVertical: spacing.md },
  muted: { color: colors.textMuted, fontSize: 13.5 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  sectionTitleText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  sectionBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  sectionBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
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
  orderItems: { marginTop: spacing.sm, gap: 3, paddingLeft: 2 },
  orderItem: { color: colors.textSecondary, fontSize: 12.5 },
  field: { marginBottom: spacing.md },
  fieldDisabled: { marginBottom: spacing.md, opacity: 0.6 },
  feedback: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  comingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  comingLabel: { color: colors.textPrimary, fontSize: 14.5, flex: 1 },
  comingHint: { color: colors.textMuted, fontSize: 12 },
  comingDivider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.sm },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 118, 107, 0.35)',
    backgroundColor: 'rgba(226, 118, 107, 0.10)',
    marginTop: spacing.sm,
  },
  payAgainWrap: { marginTop: spacing.sm },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
