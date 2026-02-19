import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useContext, useState, useEffect } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAllWalletTransactions, WalletTransaction } from "../utils/database";
import { TransactionCard } from "../components/TransactionCard";
import { formatDate, getTypeIcon, getTypeLabel } from "../utils/transactionHelpers";

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

        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            theme={theme}
            onPress={openTransactionDetail}
            formatDate={formatDate}
            getTypeIcon={getTypeIcon}
            getTypeLabel={getTypeLabel}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: 'transparent',
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
      backgroundColor: 'transparent',
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
  });
