/**
 * IP LAN de la máquina que corre el backend (`npm run dev` dentro de backend/).
 * Es la misma máquina del Metro bundler: la viste en el log de Expo
 * (exp://192.168.1.130:8081). Si tu IP cambia (otra red, reinicio del router),
 * actualízala aquí.
 */
export const API_URL = 'http://192.168.1.130:3000';

/**
 * País para los impuestos nacionales (IVA/IGV/Sales Tax) y el envío.
 * Ver la tabla completa en src/shop/pricing.ts
 */
export const COUNTRY_CODE = 'CO';

/**
 * Módulo Vista (probador con IA). Está bloqueado mientras no funcione de forma
 * estable: no aparece en la barra de navegación ni en la ficha del producto.
 * Cambia a `true` para reactivarlo.
 */
export const VISTA_ENABLED = false;
