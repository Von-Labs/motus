import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { DefiAIIcon } from './DefiAIIcon';

interface ThinkingDotsProps {
  theme: any;
}

export function ThinkingDots({ theme }: ThinkingDotsProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createAnimation(dot1Anim, 0),
      createAnimation(dot2Anim, 200),
      createAnimation(dot3Anim, 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  const getDotStyle = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <DefiAIIcon size={32} />
      <View style={styles.dotsContainer}>
        <Animated.Text style={[styles.dot, getDotStyle(dot1Anim), { color: theme.tintColor }]}>
          •
        </Animated.Text>
        <Animated.Text style={[styles.dot, getDotStyle(dot2Anim), { color: theme.tintColor }]}>
          •
        </Animated.Text>
        <Animated.Text style={[styles.dot, getDotStyle(dot3Anim), { color: theme.tintColor }]}>
          •
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
  dot: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});
