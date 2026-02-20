import { ReactNode, useEffect, useState } from 'react'
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  children: ReactNode
  style?: ViewStyle
  backgroundKey?: 'default' | 'soft' | 'warm'
}

const BACKGROUNDS = {
  default: require('../../assets/gradient-background.jpg'),
  soft: require('../../assets/gradient-background-2.jpg'),
  warm: require('../../assets/gradient-backgronud-3.jpg'),
} as const

export function AppBackground({ children, style, backgroundKey = 'default' }: Props) {
  const [currentKey, setCurrentKey] = useState<'default' | 'soft' | 'warm'>(backgroundKey)
  const [prevKey, setPrevKey] = useState<'default' | 'soft' | 'warm' | null>(null)

  const currentOpacity = useSharedValue(1)
  const prevOpacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: currentOpacity.value,
  }))

  const prevAnimatedStyle = useAnimatedStyle(() => ({
    opacity: prevOpacity.value,
  }))

  useEffect(() => {
    const nextKey = backgroundKey ?? 'default'
    if (nextKey === currentKey) return

    setPrevKey(currentKey)
    setCurrentKey(nextKey)

    // reset opacities for crossfade
    prevOpacity.value = 1
    currentOpacity.value = 0

    prevOpacity.value = withTiming(0, {
      duration: 600,
      easing: Easing.in(Easing.ease),
    })
    currentOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    })
  }, [backgroundKey, currentKey, currentOpacity, prevOpacity])

  return (
    <View style={styles.fadeContainer}>
      {prevKey && (
        <Animated.View style={[styles.absoluteFill, prevAnimatedStyle]}>
          <ImageBackground
            source={BACKGROUNDS[prevKey]}
            resizeMode="cover"
            style={styles.background}
          />
        </Animated.View>
      )}
      <Animated.View style={[styles.fadeContainer, animatedStyle]}>
        <ImageBackground
          source={BACKGROUNDS[currentKey]}
          resizeMode="cover"
          style={styles.background}
        >
          <View style={[styles.overlay, style]}>{children}</View>
        </ImageBackground>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  fadeContainer: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
})

