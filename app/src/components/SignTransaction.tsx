import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { Button, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { useState } from "react";
import { useHotWallet } from "../context/HotWalletContext";
import { signAndSendTransactionFromBase64 } from "../utils/transactionSigner";

// Get API URL from environment
const API_URL = process.env.EXPO_PUBLIC_ENV === "DEVELOPMENT"
  ? process.env.EXPO_PUBLIC_DEV_API_URL
  : process.env.EXPO_PUBLIC_PROD_API_URL;

export function SignTransaction() {
  const { account } = useMobileWallet();
  const {
    isHotWalletActive,
    signAndSendTransaction,
    requireBalance,
    publicKey: hotWalletPublicKey,
  } = useHotWallet();
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string>();
  const [error, setError] = useState<string>();

  const signerPublicKey =
    isHotWalletActive && hotWalletPublicKey
      ? hotWalletPublicKey
      : account?.address.toString();

  /**
   * Test swap: 0.001 SOL to USDC
   */
  const handleSwap = async () => {
    if (!signerPublicKey) {
      setError("Please connect wallet or create a hot wallet first");
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      setTxSignature(undefined);

      console.log("1. Getting swap quote from backend...");

      const quoteResponse = await fetch(`${API_URL}/api/jupiter/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPublicKey: signerPublicKey,
          inputMint: "So11111111111111111111111111111111111111112", // SOL
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
          amount: 1000000, // 0.001 SOL (in lamports)
          slippageBps: 50, // 0.5%
        }),
      });

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        throw new Error(errorData.message || "Failed to get quote");
      }

      const quoteData = await quoteResponse.json();
      if (!quoteData.quote?.transaction) {
        throw new Error("No transaction in quote.");
      }

      const { signature } = await signAndSendTransactionFromBase64(
        quoteData.quote.transaction,
        {
          cluster: "mainnet-beta",
          hotWallet: isHotWalletActive
            ? {
                useHotWallet: true,
                signAndSendTransaction,
                requireBalance,
              }
            : null,
        },
      );

      setTxSignature(signature);
      console.log(`View on Solscan: https://solscan.io/tx/${signature}`);
    } catch (err: any) {
      console.error("Swap failed:", err);
      setError(err.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  if (!account && !isHotWalletActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Button
        title={loading ? "Processing..." : "🔄 Test Swap: 0.001 SOL → USDC"}
        onPress={handleSwap}
        disabled={loading}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Preparing swap transaction...</Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>
          ❌ {error}
        </Text>
      )}

      {txSignature && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            ✅ Swap successful!
          </Text>
          <Text style={styles.signatureText}>
            {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  loadingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    marginTop: 12,
    fontSize: 14,
  },
  successContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signatureText: {
    color: '#155724',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
