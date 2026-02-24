import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Chat } from "./screens";
import { Header, AppBackground } from "./components";
import { HotWalletBanner } from "./components/hotWallet/HotWalletBanner";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemeContext } from "./context";
import { useHotWallet } from "./context/HotWalletContext";
import type { BackgroundKey } from "./constants/background";

/** Shared layout for drawer screens that use router navigation (Settings, Usage). */
export function DrawerScreenLayout({
  backgroundKey,
  children,
}: {
  backgroundKey: BackgroundKey;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles({ theme, insets });

  return (
    <AppBackground backgroundKey={backgroundKey}>
      <View style={styles.container}>
        <Header />
        {children}
      </View>
    </AppBackground>
  );
}

function MainComponent() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);
  const { isHotWalletFeatureEnabled } = useHotWallet();
  const styles = getStyles({ theme, insets });

  return (
    <AppBackground backgroundKey="default">
      <View style={styles.container}>
        <Header />
        {isHotWalletFeatureEnabled && <HotWalletBanner />}
        <Chat />
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
