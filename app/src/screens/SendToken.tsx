import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useContext, useState } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DOMAIN } from "../../constants";
import { handleSendTransaction, type SolanaCluster } from "../utils/swapHandler";

const LAMPORTS_PER_SOL = 1e9;

export function SendToken() {
  const { theme } = useContext(ThemeContext);
  const { walletAddress, setCurrentScreen } = useContext(AppContext);
  const [recipient, setRecipient] = useState("");
  const [amountSol, setAmountSol] = useState("");
  const [cluster, setCluster] = useState<SolanaCluster>("mainnet-beta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    const to = recipient.trim();
    const sol = amountSol.trim();
    if (!to) {
      setError("Vui lòng nhập địa chỉ người nhận.");
      return;
    }
    if (!sol || isNaN(parseFloat(sol)) || parseFloat(sol) <= 0) {
      setError("Vui lòng nhập số SOL hợp lệ (ví dụ: 0.01).");
      return;
    }
    if (!walletAddress) {
      setError("Chưa kết nối ví.");
      return;
    }

    const amountLamports = String(Math.round(parseFloat(sol) * LAMPORTS_PER_SOL));

    setLoading(true);
    try {
      const res = await fetch(`${DOMAIN}/api/sends/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: walletAddress,
          recipient: to,
          amount: amountLamports,
          cluster,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Prepare send failed");
      }

      const signature = await handleSendTransaction(
        {
          transaction: data.transaction,
          type: data.type || "sol",
          amount: data.amount,
          mint: data.mint,
        },
        cluster
      );

      Alert.alert(
        "Đã gửi",
        `Giao dịch thành công.\nSignature: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        [{ text: "OK", onPress: () => setCurrentScreen("transactions") }]
      );
      setRecipient("");
      setAmountSol("");
    } catch (e: any) {
      const raw = e?.message || String(e);
      const isNetworkError =
        raw === "Network request failed" ||
        raw === "Failed to fetch" ||
        raw?.includes("Network Error") ||
        e?.name === "TypeError";
      const msg = isNetworkError
        ? "Không kết nối được server. Trên thiết bị/emulator: trong .env đặt EXPO_PUBLIC_DEV_API_URL=http://<IP-máy>:3050 (Android emulator: http://10.0.2.2:3050), rồi chạy lại app (npx expo start -c)."
        : raw;
      setError(msg);
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  }

  const styles = getStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Gửi SOL</Text>
          <Text style={styles.subtitle}>
            Nhập địa chỉ ví người nhận và số SOL. Chọn network khớp với server.
          </Text>
        </View>

        <Text style={styles.label}>Network</Text>
        <View style={styles.networkRow}>
          <TouchableOpacity
            style={[styles.networkBtn, cluster === "mainnet-beta" && styles.networkBtnActive]}
            onPress={() => setCluster("mainnet-beta")}
            disabled={loading}
          >
            <Text style={[styles.networkBtnText, cluster === "mainnet-beta" && styles.networkBtnTextActive]}>
              Mainnet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.networkBtn, cluster === "devnet" && styles.networkBtnActive]}
            onPress={() => setCluster("devnet")}
            disabled={loading}
          >
            <Text style={[styles.networkBtnText, cluster === "devnet" && styles.networkBtnTextActive]}>
              Devnet
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Địa chỉ người nhận</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Ví dụ: 7xKX...abc"
          placeholderTextColor={theme.textColor + "80"}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Số SOL</Text>
        <TextInput
          style={styles.input}
          value={amountSol}
          onChangeText={setAmountSol}
          placeholder="Ví dụ: 0.01"
          placeholderTextColor={theme.textColor + "80"}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>Gửi</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Server phải dùng cùng network: mainnet thì SOLANA_RPC_URL mặc định, devnet thì đặt
          SOLANA_RPC_URL=https://api.devnet.solana.com trong server/.env. Giao dịch xuất hiện trong Transaction History.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.7,
    },
    networkRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 8,
    },
    networkBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.textColor + "40",
      alignItems: "center",
    },
    networkBtnActive: {
      borderColor: theme.tintColor,
      backgroundColor: theme.tintColor + "20",
    },
    networkBtnText: {
      fontSize: 15,
      color: theme.textColor,
      fontFamily: theme.regularFont,
    },
    networkBtnTextActive: {
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
    },
    label: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.textColor + "40",
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.regularFont,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      padding: 12,
      backgroundColor: "#ff444420",
      borderRadius: 8,
    },
    errorText: {
      color: "#ff4444",
      fontSize: 14,
      fontFamily: theme.regularFont,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.tintColor,
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontFamily: theme.semiBoldFont,
    },
    hint: {
      fontSize: 12,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
      marginTop: 20,
      textAlign: "center",
    },
  });
