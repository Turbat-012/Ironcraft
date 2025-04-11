import { Text, type TextProps, StyleSheet, Platform } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { scaledSize } from '@/lib/textScaling';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: scaledSize(Platform.OS === 'ios' ? 16 : 14),
    lineHeight: scaledSize(Platform.OS === 'ios' ? 24 : 22),
  },
  defaultSemiBold: {
    fontSize: scaledSize(Platform.OS === 'ios' ? 16 : 14),
    lineHeight: scaledSize(Platform.OS === 'ios' ? 24 : 22),
    fontWeight: '600',
  },
  title: {
    fontSize: scaledSize(Platform.select({ ios: 32, android: 28, default: 32 })),
    fontWeight: 'bold',
    lineHeight: scaledSize(Platform.select({ ios: 32, android: 34, default: 32 })),
  },
  subtitle: {
    fontSize: scaledSize(Platform.select({ ios: 20, android: 18, default: 20 })),
    fontWeight: 'bold',
  },
  link: {
    lineHeight: scaledSize(Platform.select({ ios: 30, android: 28, default: 30 })),
    fontSize: scaledSize(Platform.select({ ios: 16, android: 14, default: 16 })),
    color: '#0a7ea4',
  },
});
