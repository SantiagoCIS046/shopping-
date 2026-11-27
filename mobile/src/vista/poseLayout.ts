/**
 * Cálculo de la colocación de cada prenda a partir de los puntos del cuerpo
 * (MediaPipe Pose, coordenadas normalizadas 0..1 de la foto).
 *
 * Índices de MediaPipe Pose usados:
 *  11/12 hombros · 23/24 caderas · 27/28 tobillos
 */

export type Point = { x: number; y: number; visibility?: number };
export type Rect = { cx: number; cy: number; width: number; height: number }; // normalizado 0..1
export type GarmentSlot = 'top' | 'bottom' | 'shoes';

const MIN_VISIBILITY = 0.5;

const IDX = { lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24, lAnkle: 27, rAnkle: 28 } as const;

function visible(p: Point | undefined): p is Point {
  return !!p && (p.visibility ?? 1) >= MIN_VISIBILITY;
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Devuelve el rectángulo donde debe ir cada prenda, o null si no se ven
 * los puntos necesarios (la prenda queda para ajuste manual).
 */
export function layoutGarments(landmarks: Point[]): Partial<Record<GarmentSlot, Rect>> {
  const out: Partial<Record<GarmentSlot, Rect>> = {};
  const ls = landmarks[IDX.lShoulder];
  const rs = landmarks[IDX.rShoulder];
  const lh = landmarks[IDX.lHip];
  const rh = landmarks[IDX.rHip];
  const la = landmarks[IDX.lAnkle];
  const ra = landmarks[IDX.rAnkle];

  // Camisa / torso: de los hombros a la cadera, un poco más ancha que los hombros.
  if (visible(ls) && visible(rs) && visible(lh) && visible(rh)) {
    const shoulders = mid(ls, rs);
    const hips = mid(lh, rh);
    const width = dist(ls, rs) * 1.7;
    const height = Math.abs(hips.y - shoulders.y) * 1.15;
    out.top = { cx: shoulders.x, cy: (shoulders.y + hips.y) / 2, width, height };
  }

  // Pantalón: de la cadera a los tobillos.
  if (visible(lh) && visible(rh) && visible(la) && visible(ra)) {
    const hips = mid(lh, rh);
    const ankles = mid(la, ra);
    const width = dist(lh, rh) * 1.6;
    out.bottom = { cx: hips.x, cy: (hips.y + ankles.y) / 2, width, height: Math.abs(ankles.y - hips.y) };
  }

  // Zapatos: bajo los tobillos.
  if (visible(la) && visible(ra)) {
    const feet = mid(la, ra);
    const width = dist(la, ra) * 1.6 + 0.08;
    out.shoes = { cx: feet.x, cy: feet.y + 0.02, width, height: width * 0.45 };
  }

  return out;
}

/** Convierte un rectángulo normalizado en píxeles del lienzo. */
export function rectToPixels(rect: Rect, stageWidth: number, stageHeight: number) {
  const w = rect.width * stageWidth;
  const h = rect.height * stageHeight;
  return {
    left: rect.cx * stageWidth - w / 2,
    top: rect.cy * stageHeight - h / 2,
    width: w,
    height: h,
  };
}
