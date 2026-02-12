import 'react-native-gesture-handler'
import { useState, useEffect, useRef, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import * as themes from './src/theme'
import { IMAGE_MODELS, MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
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
  const [theme, setTheme] = useState<string>('defiAI')
  const [chatType, setChatType] = useState<Model>(MODELS.claudeOpus)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.nanoBanana.label)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [currentScreen, setCurrentScreen] = useState<string>('chat')
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
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

      // Force set defiAI theme (clear old theme cache)
      await AsyncStorage.setItem('rnai-theme', 'defiAI')
      setTheme('defiAI')

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
                  <Main />
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

const getBottomsheetStyles = theme => StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, .3)'
  }
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
