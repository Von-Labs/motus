import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as LocalAuthentication from "expo-local-authentication";
import * as SplashScreen from "expo-splash-screen";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import {
  ActivityIndicator,
  AppState,
  LogBox,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DOMAIN, IMAGE_MODELS, MODELS } from "./constants";
import { FEATURE_FLAGS } from "./src/constants/featureFlags";
import {
  AppBackground,
  ChatModelModal,
  OnboardingScreen,
  Sidebar,
} from "./src/components/index";
import { TopUpBottomSheet } from "./src/components/hotWallet/TopUpBottomSheet";
import { Drawer, Stack } from "./src/constants/navigation";
import { AppContext, ThemeContext } from "./src/context";
import { HotWalletProvider, useHotWallet } from "./src/context/HotWalletContext";
import { AlertProvider } from "./src/context/AlertContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { DrawerScreenLayout, Main } from "./src/main";
import {
  Bluetooth,
  HotWallet,
  NewsFeed,
  Settings,
  SendToken,
  TransactionDetail,
  TransactionHistory,
  Usage,
} from "./src/screens";
import { AllChats } from "./src/screens/allChats";
import * as themes from "./src/theme";
import { initDatabase } from "./src/utils/database";
import { isWalletInteractionActive } from "./src/utils/transactionSigner";
import { queryClient } from "./src/utils/reactQuery";
import { Model } from "./types";

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  "No native splash screen registered",
]);

export default function App() {
  const [theme, setTheme] = useState<string>("light");
  const [chatType, setChatType] = useState<Model>(MODELS.claudeOpus);
  const [imageModel, setImageModel] = useState<string>(
    IMAGE_MODELS.nanoBanana.label,
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("./assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter_18pt-SemiBold.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter_18pt-Bold.ttf"),
    "Inter-Light": require("./assets/fonts/Inter_18pt-Light.ttf"),
    "Inter-Thin": require("./assets/fonts/Inter_18pt-Thin.ttf"),
    "Inter-Black": require("./assets/fonts/Inter_18pt-Black.ttf"),
    "Inter-ExtraLight": require("./assets/fonts/Inter_18pt-ExtraLight.ttf"),
    "Inter-ExtraBold": require("./assets/fonts/Inter_18pt-ExtraBold.ttf"),
    "Lora-Regular": require("./assets/fonts/Lora-Regular.ttf"),
    "Lora-Medium": require("./assets/fonts/Lora-Medium.ttf"),
    "Lora-SemiBold": require("./assets/fonts/Lora-SemiBold.ttf"),
    "Lora-Bold": require("./assets/fonts/Lora-Bold.ttf"),
    "Lora-Italic": require("./assets/fonts/Lora-Italic.ttf"),
    "Lora-MediumItalic": require("./assets/fonts/Lora-MediumItalic.ttf"),
    "Lora-SemiBoldItalic": require("./assets/fonts/Lora-SemiBoldItalic.ttf"),
    "Lora-BoldItalic": require("./assets/fonts/Lora-BoldItalic.ttf"),
  });

  const [hasUsageBalance, setHasUsageBalance] = useState<boolean>(true);

  const checkUsageBalance = useCallback(async () => {
    if (!walletAddress) {
      setHasUsageBalance(true);
      return;
    }
    try {
      const response = await fetch(`${DOMAIN}/api/user/stats`, {
        headers: { 'X-Wallet-Address': walletAddress },
      });
      if (!response.ok) return;
      const data = await response.json();
      const freeRemaining = data.stats?.freeRequestsRemaining ?? 0;
      const usdcBalance = parseFloat(data.user?.usdc_balance || '0');
      setHasUsageBalance(freeRemaining > 0 || usdcBalance > 0);
    } catch (error) {
      console.error('Failed to check usage balance:', error);
    }
  }, [walletAddress]);

  useEffect(() => {
    checkUsageBalance();
  }, [checkUsageBalance]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkUsageBalance();
      }
    });
    return () => subscription.remove();
  }, [checkUsageBalance]);

  useEffect(() => {
    configureStorage();
  }, []);

  async function configureStorage() {
    try {
      console.log("🚀 === APP STARTING ===");
      console.log("🚀 Initializing database...");

      // Initialize SQLite database
      await initDatabase();

      console.log("🚀 Database initialized, setting up theme...");
      // Force set modern light theme as default
      await AsyncStorage.setItem("rnai-theme", "light");
      setTheme("light");

      const _chatType = await AsyncStorage.getItem("rnai-chatType");
      if (_chatType) setChatType(JSON.parse(_chatType));
      const _imageModel = await AsyncStorage.getItem("rnai-imageModel");
      if (_imageModel) setImageModel(_imageModel);

      console.log("🚀 === APP READY ===");
    } catch (err) {
      console.log("❌ ERROR configuring storage:", err);
    } finally {
      setIsStorageReady(true);
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  function closeModal() {
    bottomSheetModalRef.current?.dismiss();
    setModalVisible(false);
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal();
    } else {
      bottomSheetModalRef.current?.present();
      setModalVisible(true);
    }
  }

  function _setChatType(type) {
    setChatType(type);
    AsyncStorage.setItem("rnai-chatType", JSON.stringify(type));
  }

  function _setImageModel(model) {
    setImageModel(model);
    AsyncStorage.setItem("rnai-imageModel", model);
  }

  function _setTheme(theme) {
    setTheme(theme);
    AsyncStorage.setItem("rnai-theme", theme);
  }
  function _setOnboardingCompleted(nextValue: SetStateAction<boolean>) {
    setOnboardingCompleted(nextValue);
  }

  const bottomSheetStyles = getBottomsheetStyles(getTheme(theme));

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && isStorageReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isStorageReady]);

  if (!fontsLoaded || !isStorageReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <HotWalletProvider>
            <AppContext.Provider
              value={{
                chatType,
                setChatType: _setChatType,
                handlePresentModalPress,
                imageModel,
                setImageModel: _setImageModel,
                closeModal,
                onboardingCompleted,
                setOnboardingCompleted: _setOnboardingCompleted,
                walletAddress,
                setWalletAddress,
                sidebarOpen,
                setSidebarOpen,
                currentConversationId,
                setCurrentConversationId,
                hasUsageBalance,
                setHasUsageBalance,
                refreshUsageBalance: checkUsageBalance,
              }}
            >
              <ThemeContext.Provider
                value={{
                  theme: getTheme(theme),
                  themeName: theme,
                  setTheme: _setTheme,
                }}
              >
                <BottomSheetModalProvider>
                  <AlertProvider>
                    <ProfileProvider>
                      <ActionSheetProvider>
                        <NavigationContainer>
                          <RootNavigator />
                        </NavigationContainer>
                      </ActionSheetProvider>
                    </ProfileProvider>
                  </AlertProvider>
                  <BottomSheetModal
                    handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                    handleStyle={bottomSheetStyles.handle}
                    backgroundStyle={bottomSheetStyles.background}
                    ref={bottomSheetModalRef}
                    enableDynamicSizing={true}
                    backdropComponent={(props) => (
                      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
                    )}
                    enableDismissOnClose
                    enablePanDownToClose
                    onDismiss={() => setModalVisible(false)}
                  >
                    <BottomSheetView>
                      <ChatModelModal
                        handlePresentModalPress={handlePresentModalPress}
                      />
                    </BottomSheetView>
                  </BottomSheetModal>
                  {FEATURE_FLAGS.HOT_WALLET && <TopUpBottomSheet />}
                </BottomSheetModalProvider>
              </ThemeContext.Provider>
            </AppContext.Provider>
          </HotWalletProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </View>
  );
}

function SettingsFormSheetHeaderRight() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ padding: 8, marginRight: 8 }}
    >
      <Ionicons name="close" size={24} color="#020617" />
    </TouchableOpacity>
  );
}

function SettingsFormSheetScreen() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <Settings />
      </View>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const {
    onboardingCompleted,
    walletAddress,
    setWalletAddress,
  } = useContext(AppContext);
  const { account } = useMobileWallet();
  const { isHotWalletActive, isLoading: isHotWalletLoading } = useHotWallet();
  const [isBiometricGateActive, setIsBiometricGateActive] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const prevRequireRef = useRef(false);

  const hasConnectedWallet = Boolean(account?.address || walletAddress);
  const hasCompletedOnboarding = onboardingCompleted || isHotWalletActive;
  const requiresBiometricCheck =
    hasCompletedOnboarding && (hasConnectedWallet || isHotWalletActive);

  useEffect(() => {
    if (account?.address) {
      setWalletAddress(account.address.toString());
    } else {
      setWalletAddress(null);
    }
  }, [account, setWalletAddress]);

  useEffect(() => {
    if (!hasCompletedOnboarding || isHotWalletLoading) return;
    if (!requiresBiometricCheck) {
      setIsBiometricGateActive(false);
      prevRequireRef.current = false;
      return;
    }
    if (!prevRequireRef.current) {
      setIsBiometricGateActive(true);
    }
    prevRequireRef.current = true;
  }, [hasCompletedOnboarding, isHotWalletLoading, requiresBiometricCheck]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded =
        appStateRef.current === "background" || appStateRef.current === "inactive";
      if (wasBackgrounded && nextState === "active" && requiresBiometricCheck && !isWalletInteractionActive()) {
        setIsBiometricGateActive(true);
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [requiresBiometricCheck]);

  const handleBiometricAuthenticated = useCallback(() => {
    setIsBiometricGateActive(false);
  }, []);

  if (!onboardingCompleted && isHotWalletLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color="#020617" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingWithBackground} />
      ) : isBiometricGateActive ? (
        <Stack.Screen name="BiometricGate">
          {() => (
            <BiometricGateScreen
              onAuthenticated={handleBiometricAuthenticated}
            />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Main" component={AppDrawer} />
          <Stack.Screen
            name="Settings"
            component={SettingsFormSheetScreen}
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.25, 0.5],
              sheetInitialDetentIndex: 1,
              sheetCornerRadius: 24,
              sheetGrabberVisible: true,
              headerShown: true,
              title: "Settings",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: "transparent" },
              headerTitleStyle: { fontFamily: "Lora-SemiBold", fontSize: 18 },
              headerRight: () => <SettingsFormSheetHeaderRight />,
            }}
          />
          {FEATURE_FLAGS.HOT_WALLET && (
            <Stack.Screen name="HotWallet" component={HotWallet} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

function BiometricGateScreen({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const { theme } = useContext(ThemeContext);
  const styles = getBiometricGateStyles(theme);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runBiometricCheck = useCallback(async () => {
    setErrorMessage(null);
    setIsChecking(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // If biometrics cannot be used on this device, bypass gate to avoid loops.
      if (!hasHardware || !isEnrolled) {
        onAuthenticated();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Motus",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        onAuthenticated();
        return;
      }

      setErrorMessage("Biometric check was not completed.");
    } catch (error) {
      console.error("Biometric auth failed:", error);
      setErrorMessage("Unable to verify biometrics. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    runBiometricCheck();
  }, [runBiometricCheck]);

  return (
    <View style={styles.container}>
      <Ionicons name="finger-print-outline" size={54} color={theme.textColor} />
      <Text style={styles.title}>Biometric check</Text>
      <Text style={styles.subtitle}>
        Confirm your identity to continue to Motus.
      </Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <TouchableOpacity
        style={styles.button}
        onPress={runBiometricCheck}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator size="small" color={theme.tintTextColor} />
        ) : (
          <Text style={styles.buttonText}>Try again</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function NewsFeedScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="default">
        <NewsFeed />
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function UsageScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="soft">
        <Usage />
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function SendTokenScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="default">
        <SendToken />
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function AllChatsScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="default">
        <AllChats />
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function BluetoothScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="default">
        <Bluetooth />
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function TransactionsStackScreen() {
  return (
    <SafeAreaProvider>
      <DrawerScreenLayout backgroundKey="warm">
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen
            name="TransactionHistory"
            component={TransactionHistory}
          />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetail}
          />
        </Stack.Navigator>
      </DrawerScreenLayout>
    </SafeAreaProvider>
  );
}

function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "transparent",
      }}
      drawerContent={(props) => <Sidebar {...props} />}
    >
      <Drawer.Screen name="Home" component={Main} />
      <Drawer.Screen name="Send" component={SendTokenScreen} />
      <Drawer.Screen name="NewsFeed" component={NewsFeedScreen} />
      <Drawer.Screen name="Usage" component={UsageScreen} />
      <Drawer.Screen name="AllChats" component={AllChatsScreen} />
      <Drawer.Screen name="Bluetooth" component={BluetoothScreen} />
      <Drawer.Screen name="Transactions" component={TransactionsStackScreen} />
    </Drawer.Navigator>
  );
}

function OnboardingWithBackground() {
  return (
    <AppBackground backgroundKey="warm">
      <OnboardingScreen />
    </AppBackground>
  );
}

const getBottomsheetStyles = (theme) =>
  StyleSheet.create({
    background: {
      paddingHorizontal: 24,
      backgroundColor: theme.secondaryBackgroundColor,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: theme.borderColor,
    },
    handle: {
      marginHorizontal: 15,
      backgroundColor: theme.secondaryBackgroundColor,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    handleIndicator: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.borderColor,
      marginVertical: 8,
    },
  });

const getBiometricGateStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: 22,
      color: theme.textColor,
      fontFamily: theme.displaySemiBold || "Lora-SemiBold",
    },
    subtitle: {
      fontSize: 14,
      color: theme.mutedForegroundColor,
      textAlign: "center",
      fontFamily: theme.regularFont,
      lineHeight: 20,
    },
    error: {
      marginTop: 8,
      fontSize: 13,
      color: "#b91c1c",
      fontFamily: theme.mediumFont,
      textAlign: "center",
    },
    button: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: theme.tintColor,
      minWidth: 160,
      alignItems: "center",
    },
    buttonText: {
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont,
      fontSize: 14,
    },
  });

function getTheme(theme: any) {
  let current;
  Object.keys(themes).forEach((_theme) => {
    if (_theme.includes(theme)) {
      current = themes[_theme];
    }
  });
  return current;
}
