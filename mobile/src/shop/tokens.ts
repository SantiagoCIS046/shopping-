import { colors as base } from '../theme';

// Tokens de la tienda, alineados con la paleta de src/theme.ts.
export const colors = {
  bg: base.bg,
  bgElevated: '#0E1628',
  bgCard: '#0E1628',
  accent: base.accent, // #9ECEFF: precios y detalles
  accentButton: base.accentStrong, // #2F6BEB: botones principales
  info: base.info, // #6D9DF3
  accentSoft: 'rgba(158, 206, 255, 0.14)',
  accentBorder: 'rgba(158, 206, 255, 0.45)',
  textPrimary: base.text,
  textSecondary: base.textDim,
  textMuted: base.textFaint,
  textOnAccent: '#FFFFFF',
  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassFillStrong: 'rgba(255, 255, 255, 0.10)',
  glassBorder: base.border,
  success: '#3DD68C',
  danger: base.danger,
} as const;

/** Familias tipográficas del diseño: Playfair para títulos, DM Sans para texto. */
export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 24,
  pill: 999,
} as const;

/**
 * Espacio que dejan las pantallas al fondo para que la barra de
 * navegación flotante (glass) no tape el contenido.
 */
export const tabBarSpacing = 32;
