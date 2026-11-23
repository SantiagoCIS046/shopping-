import { colors as base } from '../theme';

// Tokens de la tienda, alineados con la paleta de src/theme.ts.
export const colors = {
  bg: base.bg,
  bgElevated: '#0B1733',
  bgCard: '#0E1E40',
  accent: base.accentStrong,
  accentSoft: 'rgba(109, 157, 243, 0.16)',
  accentBorder: 'rgba(109, 157, 243, 0.45)',
  textPrimary: base.text,
  textSecondary: base.textDim,
  textMuted: base.textFaint,
  textOnAccent: '#FFFFFF',
  glassFill: 'rgba(255, 255, 255, 0.07)',
  glassFillStrong: 'rgba(255, 255, 255, 0.10)',
  glassBorder: base.border,
  success: '#3DD68C',
  danger: base.danger,
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
export const tabBarSpacing = 96;
