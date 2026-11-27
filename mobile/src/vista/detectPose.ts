import { Asset } from 'expo-asset';
import { GarmentSlot, layoutGarments, Point, Rect } from './poseLayout';

// Modelo de pose de MediaPipe (Google). Se empaqueta con la app.
const MODEL_MODULE = require('../../assets/models/pose_landmarker_full.task');

export type GarmentLayout = Partial<Record<GarmentSlot, Rect>>;

/**
 * Detecta la postura en la foto del usuario y devuelve dónde va cada prenda.
 * Devuelve null si el módulo nativo no está disponible (p. ej. Expo Go) o si
 * no se detecta a una persona; en ese caso la app deja el ajuste manual.
 */
export async function detectGarmentLayout(photoUri: string): Promise<GarmentLayout | null> {
  let mp: typeof import('react-native-mediapipe');
  try {
    mp = require('react-native-mediapipe');
  } catch {
    return null;
  }

  try {
    const modelAsset = await Asset.fromModule(MODEL_MODULE).downloadAsync();
    const modelPath = (modelAsset.localUri ?? '').replace(/^file:\/\//, '');
    const photoPath = photoUri.replace(/^file:\/\//, '');
    if (!modelPath) return null;

    const bundle = await mp.PoseDetectionOnImage(photoPath, modelPath, {
      numPoses: 1,
      delegate: mp.Delegate.CPU,
    });

    const landmarks = bundle.results?.[0]?.landmarks?.[0] as Point[] | undefined;
    if (!landmarks || landmarks.length < 29) return null;

    return layoutGarments(landmarks);
  } catch {
    return null;
  }
}
