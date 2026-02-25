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
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { LogBox, StyleSheet, TouchableOpacity, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { IMAGE_MODELS, MODELS } from "./constants";
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
import { HotWalletProvider } from "./src/context/HotWalletContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { DrawerScreenLayout, Main } from "./src/main";
import {
  Bluetooth,
  HotWallet,
  NewsFeed,
  Settings,
  TransactionDetail,
  TransactionHistory,
  Usage,
} from "./src/screens";
import { AllChats } from "./src/screens/allChats";
import * as themes from "./src/theme";
import { initDatabase } from "./src/utils/database";
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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
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

  const bottomSheetStyles = getBottomsheetStyles(getTheme(theme));

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
                walletAddress,
                setWalletAddress,
                sidebarOpen,
                setSidebarOpen,
                currentConversationId,
                setCurrentConversationId,
              }}
            >
              <ThemeContext.Provider
                value={{
                  theme: getTheme(theme),
                  themeName: theme,
                  setTheme: _setTheme,
                }}
              >
                <ProfileProvider>
                <ActionSheetProvider>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </ActionSheetProvider>
                <BottomSheetModalProvider>
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
                </ProfileProvider>
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
  const { walletAddress } = useContext(AppContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!walletAddress ? (
        <Stack.Screen name="Onboarding" component={OnboardingWithBackground} />
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

function getTheme(theme: any) {
  let current;
  Object.keys(themes).forEach((_theme) => {
    if (_theme.includes(theme)) {
      current = themes[_theme];
    }
  });
  return current;
}
