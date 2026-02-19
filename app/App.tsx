import 'react-native-gesture-handler'
import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import * as themes from './src/theme'
import { IMAGE_MODELS, MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal, OnboardingScreen, AppBackground, Sidebar } from './src/components/index'
import { Stack, Drawer } from './src/constants/navigation'
import { Model } from './types'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { StyleSheet, LogBox, View } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './src/utils/reactQuery'
import { initDatabase } from './src/utils/database'

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [theme, setTheme] = useState<string>('light')
  const [chatType, setChatType] = useState<Model>(MODELS.claudeOpus)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.nanoBanana.label)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [currentScreen, setCurrentScreen] = useState<string>('chat')
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter-Light': require('./assets/fonts/Inter_18pt-Light.ttf'),
    'Inter-Thin': require('./assets/fonts/Inter_18pt-Thin.ttf'),
    'Inter-Black': require('./assets/fonts/Inter_18pt-Black.ttf'),
    'Inter-ExtraLight': require('./assets/fonts/Inter_18pt-ExtraLight.ttf'),
    'Inter-ExtraBold': require('./assets/fonts/Inter_18pt-ExtraBold.ttf'),
    'Lora-Regular': require('./assets/fonts/Lora-Regular.ttf'),
    'Lora-Medium': require('./assets/fonts/Lora-Medium.ttf'),
    'Lora-SemiBold': require('./assets/fonts/Lora-SemiBold.ttf'),
    'Lora-Bold': require('./assets/fonts/Lora-Bold.ttf'),
    'Lora-Italic': require('./assets/fonts/Lora-Italic.ttf'),
    'Lora-MediumItalic': require('./assets/fonts/Lora-MediumItalic.ttf'),
    'Lora-SemiBoldItalic': require('./assets/fonts/Lora-SemiBoldItalic.ttf'),
    'Lora-BoldItalic': require('./assets/fonts/Lora-BoldItalic.ttf'),
  })

  useEffect(() => {
    configureStorage()
  }, [])

  async function configureStorage() {
    try {
      console.log('🚀 === APP STARTING ===');
      console.log('🚀 Initializing database...');

      // Initialize SQLite database
      await initDatabase()

      console.log('🚀 Database initialized, setting up theme...');
      // Force set modern light theme as default
      await AsyncStorage.setItem('rnai-theme', 'light')
      setTheme('light')

      const _chatType = await AsyncStorage.getItem('rnai-chatType')
      if (_chatType) setChatType(JSON.parse(_chatType))
      const _imageModel = await AsyncStorage.getItem('rnai-imageModel')
      if (_imageModel) setImageModel(_imageModel)

      console.log('🚀 === APP READY ===');
    } catch (err) {
      console.log('❌ ERROR configuring storage:', err)
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  function closeModal() {
    bottomSheetModalRef.current?.dismiss()
    setModalVisible(false)
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal()
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }

  function _setChatType(type) {
    setChatType(type)
    AsyncStorage.setItem('rnai-chatType', JSON.stringify(type))
  }

  function _setImageModel(model) {
    setImageModel(model)
    AsyncStorage.setItem('rnai-imageModel', model)
  }

  function _setTheme(theme) {
    setTheme(theme)
    AsyncStorage.setItem('rnai-theme', theme)
  }

  const bottomSheetStyles = getBottomsheetStyles(getTheme(theme))

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
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
              currentScreen,
              setCurrentScreen,
              currentConversationId,
              setCurrentConversationId,
              selectedTransactionId,
              setSelectedTransactionId,
            }}
          >
            <ThemeContext.Provider
              value={{
                theme: getTheme(theme),
                themeName: theme,
                setTheme: _setTheme,
              }}
            >
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
                    <BottomSheetBackdrop
                      {...props}
                      disappearsOnIndex={-1}
                    />
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
              </BottomSheetModalProvider>
            </ThemeContext.Provider>
          </AppContext.Provider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </View>
  )
}

function RootNavigator() {
  const { walletAddress } = useContext(AppContext)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!walletAddress ? (
        <Stack.Screen name="Onboarding" component={OnboardingWithBackground} />
      ) : (
        <Stack.Screen name="Main" component={AppDrawer} />
      )}
    </Stack.Navigator>
  )
}

function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'transparent',
      }}
      drawerContent={(props) => <Sidebar {...props} />}
    >
      <Drawer.Screen name="Home" component={Main} />
    </Drawer.Navigator>
  )
}

function OnboardingWithBackground() {
  return (
    <AppBackground backgroundKey="warm">
      <OnboardingScreen />
    </AppBackground>
  )
}

const getBottomsheetStyles = theme =>
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
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.borderColor,
      marginVertical: 8,
    },
  })

function getTheme(theme: any) {
  let current
  Object.keys(themes).forEach(_theme => {
    if (_theme.includes(theme)) {
      current = themes[_theme]
    }
  })
  return current
}
