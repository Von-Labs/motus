import { useContext, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemeContext } from "../context";
import { AppBackground } from "../components/AppBackground";
import { EmptyState } from "../components/hotWallet/EmptyState";
import { WalletDashboard } from "../components/hotWallet/WalletDashboard";

export function HotWallet() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Stub state — will be replaced by HotWalletContext in Phase 3
  const [hasWallet, setHasWallet] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const handleCreate = async () => {
    // Stub — will call context.createHotWallet()
    await new Promise((r) => setTimeout(r, 1000));
    setPublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    setBalance(0);
    setHasWallet(true);
  };

  const handleDelete = () => {
    setHasWallet(false);
    setPublicKey(null);
    setBalance(0);
  };

  const handleTopUp = () => {
    Alert.alert(
      "Top Up",
      "This will transfer SOL from your main wallet to your hot wallet via MWA.",
    );
  };

  const handleSend = () => {
    Alert.alert("Send SOL", "Send form will be implemented in Phase 4.");
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

        {hasWallet ? (
          <WalletDashboard
            publicKey={publicKey!}
            balance={balance}
            onDelete={handleDelete}
            onTopUp={handleTopUp}
            onSend={handleSend}
          />
        ) : (
          <EmptyState onCreate={handleCreate} />
        )}
      </View>
    </AppBackground>
  );
}
