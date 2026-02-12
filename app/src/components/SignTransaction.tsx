import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Button, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { useState } from "react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

// Get API URL from environment
const API_URL = process.env.EXPO_PUBLIC_ENV === "DEVELOPMENT"
  ? process.env.EXPO_PUBLIC_DEV_API_URL
  : process.env.EXPO_PUBLIC_PROD_API_URL;

export function SignTransaction() {
  const { account } = useMobileWallet();
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string>();
  const [error, setError] = useState<string>();

  /**
   * Test swap: 0.001 SOL to USDC
   */
  const handleSwap = async () => {
    if (!account) {
      setError("Please connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      setTxSignature(undefined);

      console.log("1. Getting swap quote from backend...");

      // Step 1: Get quote with unsigned transaction from backend
      const quoteResponse = await fetch(`${API_URL}/api/jupiter/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPublicKey: account.address.toString(),
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
      console.log("2. Quote received:", quoteData);

      if (!quoteData.quote) {
        throw new Error("No quote returned from backend");
      }

      if (!quoteData.quote.transaction) {
        throw new Error("No transaction in quote. Make sure userPublicKey is provided.");
      }

      // Step 2: Sign and send transaction with wallet using transact API
      console.log("3. Asking wallet to sign and send transaction...");
      console.log("Transaction data:", quoteData.quote.transaction.slice(0, 50) + "...");

      // Use Solana Mobile Wallet Adapter to sign and send transaction
      const signatures = await transact(async (wallet: any) => {
        // Authorize the wallet first
        await wallet.authorize({
          cluster: 'mainnet-beta',
          identity: { name: 'Solana DeFi Agent' },
        });

        // Deserialize the transaction from the quote
        // Jupiter returns VersionedTransaction (v0 transactions)
        const transactionBuffer = Buffer.from(quoteData.quote.transaction, 'base64');
        const uint8Array = new Uint8Array(transactionBuffer);

        // Try to deserialize as VersionedTransaction first (Jupiter uses v0 transactions)
        let transaction: Transaction | VersionedTransaction;
        try {
          transaction = VersionedTransaction.deserialize(uint8Array);
          console.log("Deserialized as VersionedTransaction");
        } catch (e) {
          // Fallback to legacy Transaction
          transaction = Transaction.from(transactionBuffer);
          console.log("Deserialized as legacy Transaction");
        }

        // Sign and send the transaction
        const txSignatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        return txSignatures;
      });

      const txSignature = signatures[0];

      console.log("4. Transaction sent successfully!");
      setTxSignature(txSignature);
      console.log(`View on Solscan: https://solscan.io/tx/${txSignature}`);

    } catch (err: any) {
      console.error("Swap failed:", err);
      setError(err.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
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
