import { useContext, useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemeContext } from "../context";
import { useHotWallet } from "../context/HotWalletContext";
import { AppBackground } from "../components/AppBackground";
import { EmptyState } from "../components/hotWallet/EmptyState";
import { WalletDashboard } from "../components/hotWallet/WalletDashboard";
import { SendSolForm } from "../components/hotWallet/SendSolForm";

export function HotWallet() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    isHotWalletActive,
    isLoading,
    publicKey,
    balance,
    createHotWallet,
    deleteHotWallet,
    openTopUpSheet,
    sendSol,
  } = useHotWallet();
  const [showSendForm, setShowSendForm] = useState(false);

  const handleTopUp = () => {
    openTopUpSheet(0);
  };

  const handleSend = () => {
    setShowSendForm(true);
  };

  return (
    <AppBackground backgroundKey="warm">
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.textColor}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.tintColor} />
          </View>
        ) : isHotWalletActive && publicKey ? (
          showSendForm ? (
            <SendSolForm
              onSend={sendSol}
              onCancel={() => setShowSendForm(false)}
            />
          ) : (
            <WalletDashboard
              publicKey={publicKey}
              balance={balance ?? 0}
              onDelete={deleteHotWallet}
              onTopUp={handleTopUp}
              onSend={handleSend}
            />
          )
        ) : (
          <EmptyState onCreate={createHotWallet} />
        )}
      </View>
    </AppBackground>
  );
}
