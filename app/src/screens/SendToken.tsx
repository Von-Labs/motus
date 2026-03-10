import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  AppState,
} from "react-native";
import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext, AppContext } from "../context";
import { useAlert } from "../context/AlertContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DOMAIN } from "../../constants";
import { handleSendTransaction, type SolanaCluster } from "../utils/swapHandler";
import { reportErrorToDiscord } from "../utils/errorReporter";

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

// Fallback list for common tokens in the app, used when server/Jupiter returns empty
const COMMON_TOKENS: TokenOption[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT mainnet
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK mainnet
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
  },
];

export function SendToken() {
  const { theme } = useContext(ThemeContext);
  const { showAlert } = useAlert();
  const { walletAddress } = useContext(AppContext);
  const navigation = useNavigation();
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successSignature, setSuccessSignature] = useState<string | null>(null);
  const sendJustSucceededRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && sendJustSucceededRef.current) {
        sendJustSucceededRef.current = false;
      }
    });
    return () => sub.remove();
  }, [navigation]);

  const searchTokens = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setTokenSearchResults([]);
      return;
    }
    setTokenSearchLoading(true);
    try {
      const res = await fetch(
        `${DOMAIN}/api/sends/tokens?query=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const list = (Array.isArray(data) ? data : []).map((t: any) => ({
          address: t.address || t.id || t.mint,
          symbol: t.symbol || "?",
          name: t.name,
          decimals: typeof t.decimals === "number" ? t.decimals : 6,
        }));

      if (list.length > 0) {
        setTokenSearchResults(list);
      } else {
        const lc = trimmed.toLowerCase();
        const fallback = COMMON_TOKENS.filter(
          (t) =>
            t.symbol.toLowerCase().includes(lc) ||
            (t.name && t.name.toLowerCase().includes(lc))
        );
        setTokenSearchResults(fallback);
      }
    } catch (e) {
      const trimmedQuery = query.trim().toLowerCase();
      const fallback = COMMON_TOKENS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(trimmedQuery) ||
          (t.name && t.name.toLowerCase().includes(trimmedQuery))
      );
      setTokenSearchResults(fallback);
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

      setRecipient("");
      setAmount("");
      setSuccessSignature(signature);
      setSuccessModalVisible(true);
      sendJustSucceededRef.current = true;
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
      showAlert({ title: "Error", message: msg });
      reportErrorToDiscord(msg, { source: 'SendToken > handleSend', wallet: walletAddress }).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  const styles = getStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 320 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
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
                ) : tokenSearchResults.length > 0 ? (
                  <FlatList
                    data={tokenSearchResults}
                    keyExtractor={(item) => item.address || "sol"}
                    style={styles.tokenList}
                    keyboardShouldPersistTaps="handled"
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
                ) : tokenSearchQuery.trim().length >= 2 ? (
                  <Text style={[styles.noResultsText, { color: theme.textColor }]}>
                    No tokens found for "{tokenSearchQuery.trim()}"
                  </Text>
                ) : null}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSuccessModalVisible(false);
            setSuccessSignature(null);
            (navigation as any).navigate("Home");
          }}
        >
          <View style={styles.successOverlay}>
            <View style={[styles.successCard, { backgroundColor: theme.secondaryBackgroundColor, borderColor: theme.borderColor }]}>
              <View style={[styles.successIconWrap, { backgroundColor: theme.tintColor + "20" }]}>
                <Ionicons name="checkmark-circle" size={48} color={theme.tintColor} />
              </View>
              <Text style={[styles.successTitle, { color: theme.textColor }]}>Sent</Text>
              <Text style={[styles.successMessage, { color: theme.mutedForegroundColor }]}>Transaction successful</Text>
              {successSignature ? (
                <Text style={[styles.successSignature, { color: theme.textColor }]} numberOfLines={1}>
                  {successSignature.slice(0, 8)}...{successSignature.slice(-8)}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.successButton, { backgroundColor: theme.tintColor }]}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setSuccessSignature(null);
                  (navigation as any).navigate("Home");
                }}
              >
                <Text style={[styles.successButtonText, { color: theme.tintTextColor || "#fff" }]}>OK</Text>
              </TouchableOpacity>
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
          onFocus={() => scrollRef.current?.scrollTo({ y: 200, animated: true })}
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
          onFocus={() => scrollRef.current?.scrollTo({ y: 300, animated: true })}
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
    noResultsText: {
      fontSize: 14,
      fontFamily: theme.lightFont,
      opacity: 0.7,
      marginTop: 12,
    },
    successOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    successCard: {
      width: "100%",
      maxWidth: 340,
      borderRadius: 20,
      borderWidth: 1,
      padding: 24,
      alignItems: "center",
    },
    successIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 22,
      fontFamily: theme.semiBoldFont,
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 15,
      fontFamily: theme.regularFont,
      marginBottom: 8,
    },
    successSignature: {
      fontSize: 13,
      fontFamily: theme.regularFont,
      opacity: 0.8,
      marginBottom: 20,
    },
    successButton: {
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 120,
      alignItems: "center",
    },
    successButtonText: {
      fontSize: 16,
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
