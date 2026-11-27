import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';
import { PrimaryButton } from './PrimaryButton';
import { colors, radius, spacing } from '../shop/tokens';
import { getProfile, saveProfile } from '../api/profile';
import type { DocType } from '../api/orders';

const DOC_TYPES: Array<{ id: DocType; label: string }> = [
  { id: 'CC', label: 'Cédula' },
  { id: 'CE', label: 'Extranjería' },
  { id: 'NIT', label: 'NIT' },
  { id: 'PAS', label: 'Pasaporte' },
];

/**
 * Datos de pago y envío del perfil. Se llenan solos con la última compra
 * y el checkout los usa para no volver a escribirlos.
 */
export function SavedDataCard() {
  const [phone, setPhone] = useState('');
  const [docType, setDocType] = useState<DocType>('CC');
  const [docNumber, setDocNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((u) => {
        if (cancelled) return;
        setPhone(u.phone ?? '');
        setDocType(u.docType ?? 'CC');
        setDocNumber(u.docNumber ?? '');
        setCity(u.address?.city ?? '');
        setAddress(u.address?.address ?? '');
        setNeighborhood(u.address?.neighborhood ?? '');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setMsg(null);
    if (!docNumber.trim()) {
      setMsg('Escribe tu número de documento');
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        phone: phone.trim(),
        docType,
        docNumber: docNumber.trim(),
        address: { city: city.trim(), address: address.trim(), neighborhood: neighborhood.trim() },
      });
      setMsg('Datos guardados ✓');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'No pudimos guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard>
      <Text style={styles.title}>Datos de pago y envío</Text>
      <Text style={styles.hint}>Se usan en tu próxima compra para no volver a escribirlos.</Text>

      <GlassInput value={phone} onChangeText={setPhone} placeholder="Teléfono" keyboardType="phone-pad" style={styles.field} />

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
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <GlassInput
        value={docNumber}
        onChangeText={setDocNumber}
        placeholder="Número de documento"
        autoCapitalize="characters"
        style={styles.field}
      />

      <GlassInput value={city} onChangeText={setCity} placeholder="Ciudad" autoCapitalize="words" style={styles.field} />
      <GlassInput value={address} onChangeText={setAddress} placeholder="Dirección de entrega" autoCapitalize="words" style={styles.field} />
      <GlassInput value={neighborhood} onChangeText={setNeighborhood} placeholder="Barrio" autoCapitalize="words" style={styles.field} />

      {msg ? <Text style={styles.feedback}>{msg}</Text> : null}
      <PrimaryButton title="Guardar datos" onPress={save} loading={saving} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: 12.5, marginBottom: 6 },
  field: { marginBottom: spacing.md },
  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  chipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  feedback: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
});
