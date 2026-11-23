/**
 * Paleta azul/gris de la app: ambiente oscuro con acentos azules
 * y textos grisáceos. El estilo glass se mantiene en los componentes.
 */
export const colors = {
  bg: '#050A16',
  bgSoft: 'rgba(15, 23, 42, 0.55)',
  accent: '#6D9DF3', // azul claro: textos destacados, bordes, iconos
  accentStrong: '#3E7BFA', // azul del botón principal
  text: '#E8ECF4', // blanco grisáceo
  textDim: 'rgba(214, 222, 234, 0.75)',
  textFaint: 'rgba(214, 222, 234, 0.45)',
  border: 'rgba(255, 255, 255, 0.14)',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  danger: '#E2766B',
} as const;

/** Foto de la tienda, usada como fondo de la intro y de las pantallas de auth. */
export const INTRO_IMAGE = require('../assets/intro.png');

/** Rectángulo absoluto que cubre todo el contenedor padre. */
export const fill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;
