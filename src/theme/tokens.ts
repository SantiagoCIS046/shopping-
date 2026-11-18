// Tokens de diseño: una sola fuente de verdad para colores, espacios y bordes.
// Todas las pantallas deben importar desde aquí, nunca escribir colores sueltos.

export const colors = {
  // Fondos negro-azulados
  bg: '#050A16',
  bgDeep: '#02040A',
  bgElevated: '#0B1733',
  bgCard: '#0E1E40',

  // Acento azul
  accent: '#3D7BFF',
  accentSoft: 'rgba(61,123,255,0.18)',
  accentBorder: 'rgba(61,123,255,0.35)',

  // Texto
  textPrimary: '#E8EEFA',
  textSecondary: '#C9D6F0',
  textMuted: '#8FA3C7',
  textOnAccent: '#FFFFFF',

  // Glass
  glassFill: 'rgba(255,255,255,0.06)',
  glassFillStrong: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(160,190,255,0.16)',

  // Estados
  success: '#3DD68C',
  danger: '#FF6B6B',
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

export const typography = {
  title: { fontSize: 20, fontWeight: '600' as const },
  subtitle: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
