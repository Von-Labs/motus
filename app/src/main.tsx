import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Bluetooth, Chat, Settings } from "./screens";
import { Header, Sidebar, OnboardingScreen } from "./components";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemeContext, AppContext } from "./context";

function MainComponent() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);
  const { walletAddress, sidebarOpen, setSidebarOpen, currentScreen } =
    useContext(AppContext);
  const styles = getStyles({ theme, insets });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show Onboarding when wallet not connected
  if (!walletAddress) {
    return (
      <View style={styles.container}>
        <OnboardingScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header onMenuPress={toggleSidebar} />

      {/* Current Screen */}
      {currentScreen === "chat" && <Chat />}
      {currentScreen === "settings" && <Settings />}
      {currentScreen === "bluetooth" && <Bluetooth />}
    </View>
  );
}

export function Main() {
  return (
    <SafeAreaProvider>
      <MainComponent />
    </SafeAreaProvider>
  );
}

const getStyles = ({ theme, insets }: { theme: any; insets: any }) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
  });
