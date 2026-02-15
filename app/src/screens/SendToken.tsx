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
  Modal,
  FlatList,
} from "react-native";
import { useContext, useState, useCallback } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DOMAIN } from "../../constants";
import { handleSendTransaction, type SolanaCluster } from "../utils/swapHandler";

const LAMPORTS_PER_SOL = 1e9;

export type TokenOption = {
  address: string | null;
  symbol: string;
  name?: string;
  decimals: number;
};

const SOL_OPTION: TokenOption = {
  address: null,
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
};

export function SendToken() {
  const { theme } = useContext(ThemeContext);
  const { walletAddress, setCurrentScreen } = useContext(AppContext);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenOption>(SOL_OPTION);
  const [cluster, setCluster] = useState<SolanaCluster>("mainnet-beta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [tokenSearchResults, setTokenSearchResults] = useState<TokenOption[]>([]);
  const [tokenSearchLoading, setTokenSearchLoading] = useState(false);

  const searchTokens = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTokenSearchResults([]);
      return;
    }
    setTokenSearchLoading(true);
    try {
      const res = await fetch(
        `${DOMAIN}/api/sends/tokens?query=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const list = Array.isArray(data) ? data : [];
      setTokenSearchResults(
        list.map((t: any) => ({
          address: t.address || t.id || t.mint,
          symbol: t.symbol || "?",
          name: t.name,
          decimals: typeof t.decimals === "number" ? t.decimals : 6,
        }))
      );
    } catch (e) {
      setTokenSearchResults([]);
    } finally {
      setTokenSearchLoading(false);
    }
  }, []);

  function openTokenModal() {
    setTokenModalVisible(true);
    setTokenSearchQuery("");
    setTokenSearchResults([]);
  }

  function selectToken(token: TokenOption) {
    setSelectedToken(token);
    setTokenModalVisible(false);
  }

  async function handleSend() {
    setError(null);
    const to = recipient.trim();
    const amt = amount.trim();
    if (!to) {
      setError("Please enter the recipient address.");
      return;
    }
    const num = parseFloat(amt);
    if (!amt || isNaN(num) || num <= 0) {
      setError(`Please enter a valid ${selectedToken.symbol} amount.`);
      return;
    }
    if (!walletAddress) {
      setError("Wallet not connected.");
      return;
    }

    const decimals = selectedToken.decimals;
    const amountRaw =
      selectedToken.address === null
        ? String(Math.round(num * LAMPORTS_PER_SOL))
        : String(Math.round(num * Math.pow(10, decimals)));

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        sender: walletAddress,
        recipient: to,
        amount: amountRaw,
        cluster,
      };
      if (selectedToken.address) {
        body.mint = selectedToken.address;
        body.decimals = decimals;
      }

      const res = await fetch(`${DOMAIN}/api/sends/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          decimals: selectedToken.address ? selectedToken.decimals : undefined,
          symbol: selectedToken.symbol,
          name: selectedToken.name,
        },
        cluster
      );

      Alert.alert(
        "Sent",
        `Transaction successful.\nSignature: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        [{ text: "OK", onPress: () => setCurrentScreen("transactions") }]
      );
      setRecipient("");
      setAmount("");
    } catch (e: any) {
      const raw = e?.message || String(e);
      const isNetworkError =
        raw === "Network request failed" ||
        raw === "Failed to fetch" ||
        raw?.includes("Network Error") ||
        e?.name === "TypeError";
      const msg = isNetworkError
        ? "Could not reach the server. On device/emulator: set EXPO_PUBLIC_DEV_API_URL in .env to http://<your-IP>:3050 (Android emulator: http://10.0.2.2:3050), then restart the app (npx expo start -c)."
        : raw;
      setError(msg);
      Alert.alert("Error", msg);
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
          <Text style={styles.title}>Send token</Text>
          <Text style={styles.subtitle}>
            Select token (SOL or any Jupiter token), recipient address and amount. Use the same network as your wallet.
          </Text>
        </View>

        <Text style={styles.label}>Token</Text>
        <TouchableOpacity
          style={styles.tokenButton}
          onPress={openTokenModal}
          disabled={loading}
        >
          <Text style={styles.tokenButtonText}>
            {selectedToken.symbol} {selectedToken.name ? `(${selectedToken.name})` : ""}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.textColor} />
        </TouchableOpacity>

        <Modal
          visible={tokenModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setTokenModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textColor }]}>Select token</Text>
                <TouchableOpacity onPress={() => setTokenModalVisible(false)}>
                  <Ionicons name="close" size={28} color={theme.textColor} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.tokenOption, { borderColor: theme.borderColor }]}
                onPress={() => selectToken(SOL_OPTION)}
              >
                <Text style={[styles.tokenOptionSymbol, { color: theme.textColor }]}>SOL</Text>
                <Text style={[styles.tokenOptionName, { color: theme.textColor, opacity: 0.7 }]}>Solana (native)</Text>
              </TouchableOpacity>
              <Text style={[styles.label, { marginTop: 12 }]}>Search by name or symbol</Text>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                value={tokenSearchQuery}
                onChangeText={(q) => {
                  setTokenSearchQuery(q);
                  if (q.trim().length >= 2) {
                    searchTokens(q);
                  } else {
                    setTokenSearchResults([]);
                  }
                }}
                placeholder="e.g. USDC, BONK..."
                placeholderTextColor={theme.textColor + "80"}
                autoCapitalize="characters"
              />
              {tokenSearchLoading ? (
                <ActivityIndicator size="small" color={theme.tintColor} style={{ marginVertical: 16 }} />
              ) : (
                <FlatList
                  data={tokenSearchResults}
                  keyExtractor={(item) => item.address || "sol"}
                  style={styles.tokenList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.tokenOption, { borderColor: theme.borderColor }]}
                      onPress={() => selectToken(item)}
                    >
                      <Text style={[styles.tokenOptionSymbol, { color: theme.textColor }]}>{item.symbol}</Text>
                      <Text style={[styles.tokenOptionName, { color: theme.textColor, opacity: 0.7 }]} numberOfLines={1}>
                        {item.name || item.address?.slice(0, 8) + "..."}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

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

        <Text style={styles.label}>Recipient address</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="e.g. 7xKX...abc"
          placeholderTextColor={theme.textColor + "80"}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Amount ({selectedToken.symbol})</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder={selectedToken.address === null ? "e.g. 0.01" : "e.g. 10"}
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
              <Text style={styles.buttonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>

        
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
    tokenButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.textColor + "40",
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    tokenButtonText: {
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.regularFont,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: theme.semiBoldFont,
    },
    tokenOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    tokenOptionSymbol: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
    },
    tokenOptionName: {
      fontSize: 14,
      fontFamily: theme.lightFont,
      flex: 1,
      marginLeft: 12,
    },
    tokenList: {
      maxHeight: 220,
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
