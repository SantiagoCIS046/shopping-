/**
 * Paleta azul/gris de la app: ambiente oscuro con acentos azules
 * y textos grisáceos. El estilo glass se mantiene en los componentes.
 */
export const colors = {
  bg: '#050A16', // azul marino: fondo principal
  bgSoft: 'rgba(14, 22, 40, 0.75)', // superficies (#0E1628)
  accent: '#9ECEFF', // azul claro: precios, estrellas, detalles
  accentStrong: '#2F6BEB', // botón principal
  info: '#6D9DF3', // información
  text: '#E8ECF4', // texto principal
  textDim: '#9296A0', // texto secundario (~62 %)
  textFaint: 'rgba(146, 150, 160, 0.75)',
  border: 'rgba(232, 236, 244, 0.12)',
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
