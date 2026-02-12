import { Image, StyleSheet } from 'react-native';

interface DefiAIIconProps {
  size?: number;
}

export function DefiAIIcon({ size = 32 }: DefiAIIconProps) {
  return (
    <Image
      source={require('../../assets/defi-ai-icon-circle.png')}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 100,
  },
});
