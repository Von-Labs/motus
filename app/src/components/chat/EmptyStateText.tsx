import { useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet, type ViewStyle } from 'react-native';

interface EmptyStateTextProps {
  text: string;
  theme: {
    textColor: string;
    regularFont: string;
  };
  style?: ViewStyle;
}

export function EmptyStateText({ text, theme, style }: EmptyStateTextProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Typewriter-style character animation
    const animation = Animated.timing(progress, {
      toValue: text.length,
      duration: text.length * 40, // ~40ms per character
      useNativeDriver: false,
    });

    const listenerId = progress.addListener(({ value }) => {
      setVisibleChars(Math.min(text.length, Math.floor(value)));
    });

    animation.start(() => {
      progress.removeListener(listenerId);
    });

    return () => {
      animation.stop();
      progress.removeListener(listenerId);
    };
  }, [progress, text]);

  const styles = getStyles(theme);
  const displayedText = text.slice(0, visibleChars);

  return (
    <Text style={[styles.text, style]}>{displayedText}</Text>
  );
}

const getStyles = (theme: { textColor: string; regularFont: string }) =>
  StyleSheet.create({
    text: {
      color: theme.textColor,
      fontSize: 24,
      fontFamily: theme.regularFont,
      marginTop: 20,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
  });
