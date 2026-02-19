import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Bluetooth, Chat, Settings, TransactionHistory, TransactionDetail, Usage } from "./screens";
import { AllChats } from "./screens/allChats";
import { Header, AppBackground } from "./components";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemeContext, AppContext } from "./context";
import { getBackgroundKeyForScreen } from "./constants/background";

function MainComponent() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);
  const { currentScreen } = useContext(AppContext);
  const styles = getStyles({ theme, insets });

  const backgroundKey = getBackgroundKeyForScreen(currentScreen);

  return (
    <AppBackground backgroundKey={backgroundKey}>
      <View style={styles.container}>
        {/* Header */}
        <Header />

        {/* Current Screen */}
        {currentScreen === "chat" && <Chat />}
        {currentScreen === "settings" && <Settings />}
        {currentScreen === "bluetooth" && <Bluetooth />}
        {currentScreen === "allChats" && <AllChats />}
        {currentScreen === "transactions" && <TransactionHistory />}
        {currentScreen === "transactionDetail" && <TransactionDetail />}
        {currentScreen === "usage" && <Usage />}
      </View>
    </AppBackground>
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
      backgroundColor: 'transparent',
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
  });
