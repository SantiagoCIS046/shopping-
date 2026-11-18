# Tienda Ropa (React Native + Expo)

App móvil para comprar ropa con probador virtual. Estilo oscuro negro-azulado, fondo urbano y paneles glass.

## Puesta en marcha

```bash
npm install
npx expo install --fix      # alinea las versiones con el SDK de Expo
npx expo start
```

Escanea el código QR con la app **Expo Go** en tu celular, o usa un emulador.

> Esta base no se ha ejecutado todavía. Antes de programar encima, corre `npm run typecheck` y `npx expo install --fix`.

## Estructura

```
App.tsx                      Punto de entrada: proveedores y navegación
src/
  theme/tokens.ts            Colores, espacios, radios y tipografía (fuente única de estilos)
  components/
    GlassCard.tsx            Panel glass con blur real
    PrimaryButton.tsx        Botón con háptica y altura mínima de 44px
    UrbanBackground.tsx      Fondo urbano (degradado, cuadrícula y edificios)
    TryOnCanvas.tsx          Probador fase 1: foto + prenda que se mueve y escala
  screens/
    CatalogScreen.tsx        Catálogo con categorías y búsqueda
    ProductScreen.tsx        Ficha, cambio de prenda, tallas y carrito
    CheckoutScreen.tsx       Resumen y métodos de pago
  navigation/RootNavigator.tsx
  context/CartContext.tsx    Carrito en memoria (luego, Firestore)
  data/products.ts           Datos de ejemplo y formato de pesos colombianos
```

## Cómo cambiar el estilo

Todos los colores y espacios viven en `src/theme/tokens.ts`. Para cambiar el azul de marca, edita `colors.accent`. Ningún componente debe escribir colores sueltos.

## Pendiente antes de lanzar

1. **Ir al carrito desde el catálogo o la ficha.** Hoy `CheckoutScreen` existe, pero no hay botón que lleve a él.
2. **Backend.** Firebase Auth, Firestore para productos y pedidos, y Storage para imágenes.
3. **Pagos.** Integrar Wompi, ePayco o Mercado Pago. La tarjeta se procesa en la pasarela, nunca en la app.
4. **Probador fase 2.** Detección de pose (por ejemplo, ML Kit con `react-native-vision-camera` o una librería de pose) para ajustar la prenda al cuerpo.
5. **Quitar el fondo de las prendas.** Segmentación en el servidor o una API de terceros.
6. **Legal.** Términos, política de datos (Ley 1581 de 2012) y facturación.
7. **Pruebas y rendimiento.** Probar en un celular real; el probador con imágenes pesadas puede bajar los cuadros por segundo.

## Dependencias clave

| Paquete | Para qué |
|---|---|
| `expo-blur` | Efecto glass real |
| `expo-linear-gradient` | Fondo degradado |
| `react-native-svg` | Siluetas urbanas |
| `expo-image-picker` | Subir foto desde el celular |
| `expo-camera` | Tomar foto (pendiente de conectar) |
| `expo-haptics` | Retroalimentación táctil |
| `expo-image` | Imágenes con caché |
| `@react-navigation/native-stack` | Navegación entre pantallas |
