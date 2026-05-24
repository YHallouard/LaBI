import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const IMAGE_MAP: Record<string, any> = {
  'app-icon': require('../../../assets/icon-ios.png'),
  'logo': require('../../../assets/logo-master.png'),
  'wordmark': require('../../../assets/wordmark-md.png'),
};

interface Props {
  source?: any;
  imagePath?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function AppImage({ source, imagePath, style, resizeMode = 'contain' }: Props) {
  const resolved = imagePath ? IMAGE_MAP[imagePath] ?? null : source;
  if (!resolved) return null;
  return <Image source={resolved} style={style} resizeMode={resizeMode} />;
}
