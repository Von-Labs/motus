import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppContext, ThemeContext } from "../../context";
import { useHotWallet } from "../../context/HotWalletContext";
import { reportErrorToDiscord } from "../../utils/errorReporter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PAGES = [
  {
    key: "welcome",
    title: "Welcome to Motus",
    subtitle: "Your Solana Mobile AI Agent",
    body: "",
    icon: "👋",
  },
  {
    key: "help",
    title: "Your AI DeFi Assistant",
    subtitle: "How we help you",
    body: "Our AI agent helps you navigate DeFi with confidence. Get swap suggestions, portfolio insights, and plain-English explanations—all in one place.",
    icon: "🤖",
  },
  {
    key: "connect",
    title: "Choose your wallet path",
    subtitle: "Required setup",
    body: "Pick one setup option to continue: connect your wallet, or create a hot wallet for immediate in-app transactions.",
    icon: "📱",
  },
  {
    key: "transparent",
    title: "Transparent & You Approve",
    subtitle: "You’re in control",
    body: "Every transaction is transparent and needs your approval. We never sign or send anything without showing you exactly what will happen first.",
    icon: "✓",
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
  const { setWalletAddress, setOnboardingCompleted } = useContext(AppContext);
  const { account, connect } = useMobileWallet();
  const { createHotWallet, isHotWalletFeatureEnabled } = useHotWallet();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWalletSetupChoice, setShowWalletSetupChoice] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [creatingHotWallet, setCreatingHotWallet] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const dotWidths = useRef(
    PAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;
  const styles = getStyles(theme, insets);

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
    setConnectingWallet(true);
    try {
      await connect();
      setOnboardingCompleted(true);
      navigation.navigate("Main");
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      reportErrorToDiscord(error?.message || String(error), { source: 'Onboarding > handleConnectWallet' }).catch(() => {});
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleCreateHotWallet = async () => {
    setCreatingHotWallet(true);
    try {
      await createHotWallet();
      setOnboardingCompleted(true);
      navigation.navigate("Main");
    } catch (error: any) {
      console.error("Failed to create hot wallet:", error);
      reportErrorToDiscord(error?.message || String(error), { source: 'Onboarding > handleCreateHotWallet' }).catch(() => {});
    } finally {
      setCreatingHotWallet(false);
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
      // On last page, let users choose wallet setup
      setShowWalletSetupChoice(true);
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

  if (showWalletSetupChoice) {
    return (
      <View style={styles.container}>
        <View style={[styles.gradient, { justifyContent: "center" }]}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.subtitle}>Wallet setup</Text>
          <Text style={styles.title}>Choose how to start</Text>
          <Text style={styles.body}>Choose one option to continue.</Text>

          <TouchableOpacity
            style={[styles.setupActionButton, { marginTop: 24 }]}
            onPress={handleConnectWallet}
            disabled={connectingWallet || creatingHotWallet}
          >
            {connectingWallet ? (
              <ActivityIndicator color={theme.tintTextColor} />
            ) : (
              <Text style={styles.buttonText}>Connect wallet</Text>
            )}
          </TouchableOpacity>

          {isHotWalletFeatureEnabled && (
            <TouchableOpacity
              style={[styles.setupActionButton, { marginTop: 12 }]}
              onPress={handleCreateHotWallet}
              disabled={creatingHotWallet || connectingWallet}
            >
              {creatingHotWallet ? (
                <ActivityIndicator color={theme.tintTextColor} />
              ) : (
                <Text style={styles.buttonText}>Create hot wallet</Text>
              )}
            </TouchableOpacity>
          )}

        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
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
              outputRange: [8, 22],
            });
            const backgroundColor = dotWidths[i].interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(15, 23, 42, 0.20)", "#020617"],
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
          <Animated.View
            style={[{ transform: [{ scale: buttonScale }] }, styles.button]}
          >
            <Text style={styles.buttonText}>
              {isLast ? "Continue" : "Next"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    gradient: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 24,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    page: {
      width: SCREEN_WIDTH,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 120,
    },
    pageContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(99, 102, 241, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(99, 102, 241, 0.24)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    icon: {
      fontSize: 40,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
      letterSpacing: 1.5,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    title: {
      fontSize: 42,
      fontFamily: theme.displayBold || "Lora-Bold",
      color: theme.textColor,
      textAlign: "center",
      marginBottom: 18,
      paddingHorizontal: 8,
      letterSpacing: 0.3,
    },
    body: {
      fontSize: 16,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
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
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#6366F1",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    button: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.tintColor,
    },
    buttonText: {
      fontSize: 18,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    setupActionButton: {
      width: SCREEN_WIDTH * 0.8,
      maxWidth: 320,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.tintColor,
      overflow: "hidden",
    },
  });
