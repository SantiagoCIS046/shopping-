import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { GlassCard } from '../components/GlassCard';
import { colors, spacing } from '../shop/tokens';

type Section = { id: string; title: string; icon: string; body: string[] };

const SECTIONS: Section[] = [
  {
    id: 'terminos',
    title: 'Términos y condiciones',
    icon: 'document-text-outline',
    body: [
      'Shopping es una aplicación de comercio electrónico operada por la tienda de ropa ubicada en tu ciudad de despacho. Al registrarte y comprar aceptas estos términos.',
      'Los precios se expresan en pesos colombianos (COP) e incluyen el IVA correspondiente. Los precios y el stock pueden cambiar sin previo aviso; el valor final se confirma al pagar.',
      'Contacto y soporte: soporte@shopping.app · WhatsApp 300-000-0000. Ciudad de despacho: Bogotá D.C., Colombia.',
      'Estos términos se rigen por la legislación colombiana, en especial el Estatuto del Consumidor (Ley 1480 de 2011).',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios, devoluciones y garantías',
    icon: 'swap-horizontal-outline',
    body: [
      'Tienes 30 días calendario desde la entrega para solicitar cambio o devolución, presentando el comprobante de compra (número de pedido).',
      'La prenda debe estar sin uso, con etiquetas originales puestas y en su empaque. Por higiene, no se aceptan devoluciones de lociones ni ropa interior abierta.',
      'Los cambios por talla o color no tienen costo de envío la primera vez. Las devoluciones por decisión del cliente asumen el costo de retorno y se reembolsan por el mismo medio de pago en hasta 10 días hábiles.',
      'Garantía legal: los productos tienen la garantía mínima estatuaria del Estatuto del Consumidor frente a defectos de fabricación.',
    ],
  },
  {
    id: 'datos',
    title: 'Política de tratamiento de datos (Ley 1581)',
    icon: 'lock-closed-outline',
    body: [
      'Responsable del tratamiento: Shopping. Tus datos (nombre, correo, teléfono y dirección de entrega) se usan exclusivamente para procesar pedidos, envíos, soporte y, si lo autorizas, enviar promociones.',
      'Tratamos tus contraseñas cifradas (nunca en texto plano) y no compartimos tu información con terceros salvo la transportadora necesaria para tu envío.',
      'Conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos escribiendo a datos@shopping.app. También puedes autorizar o revocar el uso comercial de tus datos en cualquier momento.',
      'Al crear tu cuenta y al comprar aceptas este tratamiento. La aceptación queda registrada con la fecha de tu pedido.',
    ],
  },
];

/**
 * Políticas legales de la tienda: términos, cambios/devoluciones y
 * tratamiento de datos (Ley 1581). Requeridas por las pasarelas de
 * pago para pasar a producción.
 */
export function LegalScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<string | null>(SECTIONS[0].id);

  return (
    <View style={styles.root}>
      <AuthBackdrop intensity={70} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
          <Text style={styles.title}>Legal</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => {
            const expanded = open === section.id;
            return (
              <GlassCard key={section.id} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(expanded ? null : section.id)}
                  style={styles.header}
                >
                  <Ionicons
                    name={section.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={17}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.headerTitle}>{section.title}</Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={colors.textMuted}
                  />
                </Pressable>

                {expanded ? (
                  <View style={styles.body}>
                    {section.body.map((paragraph, i) => (
                      <Text key={i} style={styles.paragraph}>
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </GlassCard>
            );
          })}

          <Text style={styles.footer}>
            Shopping · Bogotá D.C., Colombia — soporte@shopping.app · WhatsApp 300-000-0000
          </Text>
        </ScrollView>
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
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  spacer: { width: 60 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 0 },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  body: { marginTop: spacing.md, gap: spacing.sm },
  paragraph: { color: colors.textSecondary, fontSize: 13.5, lineHeight: 20.5 },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
