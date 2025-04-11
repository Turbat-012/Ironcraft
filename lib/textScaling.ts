import { PixelRatio, Platform } from 'react-native';

export const scaledSize = (size: number): number => {
  const scale = PixelRatio.getFontScale();
  // Prevent text from scaling beyond 1.2x normal size
  const maxScale = Math.min(scale, 1.2);
  return Platform.select({
    ios: size * maxScale,
    android: size * maxScale,
    default: size,
  });
};