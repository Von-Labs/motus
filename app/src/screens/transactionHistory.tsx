import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useContext, useState, useEffect } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAllWalletTransactions, WalletTransaction } from "../utils/database";

export function TransactionHistory() {
  const { theme } = useContext(ThemeContext);
  const { setCurrentScreen, setSelectedTransactionId } = useContext(AppContext);
  const styles = getStyles(theme);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const txs = await getAllWalletTransactions();
      setTransactions(txs);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case "swap":
        return "swap-horizontal";
      case "trigger_order":
        return "checkmark-circle";
      case "cancel_order":
        return "close-circle";
      default:
        return "help-circle";
    }
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case "swap":
        return "Swap";
      case "trigger_order":
        return "Trigger Order";
      case "cancel_order":
        return "Cancel Order";
      default:
        return type;
    }
  }

  function openTransactionDetail(tx: WalletTransaction) {
    setSelectedTransactionId(tx.id);
    setCurrentScreen("transactionDetail");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tintColor} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="receipt-outline"
          size={64}
          color={theme.textColor}
          style={{ opacity: 0.3 }}
        />
        <Text style={styles.emptyTitle}>No Transactions</Text>
        <Text style={styles.emptySubtitle}>
          Your transaction history will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction History</Text>
          <Text style={styles.subtitle}>{transactions.length} transactions</Text>
        </View>

        {transactions.map((tx) => {
          const details = JSON.parse(tx.details);
          return (
            <TouchableOpacity
              key={tx.id}
              style={styles.transactionCard}
              onPress={() => openTransactionDetail(tx)}
              activeOpacity={0.7}
            >
              <View style={styles.transactionHeader}>
                <View style={styles.transactionTypeContainer}>
                  <View
                    style={[
                      styles.iconContainer,
                      tx.status === "success"
                        ? styles.successIcon
                        : styles.failedIcon,
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(tx.type)}
                      size={20}
                      color={tx.status === "success" ? "#00ff88" : "#ff4444"}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {getTypeLabel(tx.type)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(tx.createdAt)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    tx.status === "success"
                      ? styles.successBadge
                      : styles.failedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      tx.status === "success"
                        ? styles.successText
                        : styles.failedText,
                    ]}
                  >
                    {tx.status}
                  </Text>
                </View>
              </View>

              {/* Transaction Details */}
              {details && (
                <View style={styles.detailsContainer}>
                  {details.inputMint && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>
                        {details.inputMint.slice(0, 8)}...
                      </Text>
                    </View>
                  )}
                  {details.outputMint && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>
                        {details.outputMint.slice(0, 8)}...
                      </Text>
                    </View>
                  )}
                  {details.amount && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>{details.amount}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Signature */}
              <TouchableOpacity
                style={styles.signatureContainer}
                onPress={() => {
                  // Could open Solana explorer
                  console.log("Signature:", tx.signature);
                }}
              >
                <Text style={styles.signatureLabel}>Signature:</Text>
                <Text style={styles.signatureValue}>
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={theme.tintColor}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
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
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.backgroundColor,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      opacity: 0.6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.backgroundColor,
      padding: 40,
    },
    emptyTitle: {
      fontSize: 20,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
      marginTop: 8,
      textAlign: "center",
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
    },
    transactionCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    transactionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    transactionTypeContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    successIcon: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedIcon: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    transactionInfo: {
      flex: 1,
    },
    transactionType: {
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    successBadge: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedBadge: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    statusText: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      textTransform: "capitalize",
    },
    successText: {
      color: "#00ff88",
    },
    failedText: {
      color: "#ff4444",
    },
    detailsContainer: {
      marginBottom: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
    },
    detailValue: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.regularFont,
    },
    signatureContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    signatureLabel: {
      fontSize: 12,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
      marginRight: 8,
    },
    signatureValue: {
      flex: 1,
      fontSize: 12,
      color: theme.tintColor,
      fontFamily: theme.regularFont,
    },
  });
