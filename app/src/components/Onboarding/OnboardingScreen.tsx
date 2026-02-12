import { useContext, useRef, useState, useEffect } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { ThemeContext, AppContext } from '../../context';
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  {
    key: 'welcome',
    title: 'Welcome to Solana Mobile AI Agent',
    subtitle: 'Welcome',
    body: '',
    icon: '👋',
  },
  {
    key: 'help',
    title: 'Your AI DeFi Assistant',
    subtitle: 'How we help you',
    body: 'Our AI agent helps you navigate DeFi with confidence. Get swap suggestions, portfolio insights, and plain-English explanations—all in one place.',
    icon: '🤖',
  },
  {
    key: 'connect',
    title: 'Connect with Solana Mobile',
    subtitle: 'Secure & native',
    body: 'You need to connect with Solana Mobile to use this app. Link your wallet once and the AI can help you execute swaps and manage your assets safely.',
    icon: '📱',
  },
  {
    key: 'transparent',
    title: 'Transparent & You Approve',
    subtitle: 'You’re in control',
    body: 'Every transaction is transparent and needs your approval. We never sign or send anything without showing you exactly what will happen first.',
    icon: '✓',
  },
];

type PageItem = (typeof PAGES)[number];

function AnimatedPageContent({
  page,
  isActive,
  styles,
}: {
  page: PageItem;
  isActive: boolean;
  styles: ReturnType<typeof getStyles>;
}) {
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isActive ? 0 : 20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: isActive ? 1 : 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: isActive ? 0 : 20,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.pageContent,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View style={styles.iconCircle}>
        <Text style={styles.icon}>{page.icon}</Text>
      </Animated.View>
      <Text style={styles.subtitle}>{page.subtitle}</Text>
      <Text style={styles.title}>{page.title}</Text>
      <Text style={styles.body}>{page.body}</Text>
    </Animated.View>
  );
}

export function OnboardingScreen() {
  const { theme } = useContext(ThemeContext);
  const { setWalletAddress } = useContext(AppContext);
  const { account, connect } = useMobileWallet();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const dotWidths = useRef(
    PAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const styles = getStyles(theme, insets);

  // Update wallet address when connected
  useEffect(() => {
    if (account) {
      setWalletAddress(account.address.toString());
    }
  }, [account, setWalletAddress]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < PAGES.length) {
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    dotWidths.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === currentIndex ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }).start();
    });
  }, [currentIndex, dotWidths]);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const goNext = () => {
    if (currentIndex < PAGES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // On last page, connect wallet
      handleConnectWallet();
    }
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const isLast = currentIndex === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#0f0f23']}
        style={styles.gradient}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          {PAGES.map((p, i) => (
            <View key={p.key} style={styles.page}>
              <AnimatedPageContent
                page={p}
                isActive={i === currentIndex}
                styles={styles}
              />
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View style={styles.dots}>
          {PAGES.map((p, i) => {
            const width = dotWidths[i].interpolate({
              inputRange: [0, 1],
              outputRange: [8, 24],
            });
            const backgroundColor = dotWidths[i].interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 255, 255, 0.25)', '#00e5e5'],
            });
            return (
              <Animated.View
                key={p.key}
                style={[
                  styles.dotBase,
                  {
                    width,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.buttonWrap}
          onPress={goNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.button]}>
            <Text style={styles.buttonText}>
              {isLast ? 'Connect wallet' : 'Next'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

type ThemeFonts = {
  mediumFont: string;
  boldFont: string;
  regularFont: string;
  semiBoldFont: string;
};

const getStyles = (theme: ThemeFonts, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0f0f23',
    },
    gradient: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 24,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    page: {
      width: SCREEN_WIDTH,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 120,
    },
    pageContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(0, 229, 229, 0.15)',
      borderWidth: 2,
      borderColor: 'rgba(0, 229, 229, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    icon: {
      fontSize: 40,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: theme.mediumFont,
      color: '#00e5e5',
      letterSpacing: 1.5,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 26,
      fontFamily: theme.boldFont,
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    body: {
      fontSize: 16,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.75)',
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 32,
    },
    dotBase: {
      height: 8,
      borderRadius: 4,
    },
    buttonWrap: {
      width: SCREEN_WIDTH * 0.8,
      maxWidth: 320,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#00e5e5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    button: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EBF4F5',
    },
    buttonText: {
      fontSize: 18,
      fontFamily: theme.semiBoldFont,
      color: '#0f0f23',
      letterSpacing: 1,
    },
  });
