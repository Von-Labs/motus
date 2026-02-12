import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useContext, useState, useEffect } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getWalletTransactionById, WalletTransaction } from "../utils/database";

export function TransactionDetail() {
  const { theme } = useContext(ThemeContext);
  const { selectedTransactionId, setCurrentScreen } = useContext(AppContext);
  const styles = getStyles(theme);
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [selectedTransactionId]);

  async function loadTransaction() {
    if (!selectedTransactionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tx = await getWalletTransactionById(selectedTransactionId);
      setTransaction(tx);
    } catch (error) {
      console.error("Failed to load transaction:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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

  async function copySignature(signature: string) {
    await Clipboard.setStringAsync(signature);
    Alert.alert("Copied", "Transaction signature copied to clipboard");
  }

  function openSolscan(signature: string) {
    const url = `https://solscan.io/tx/${signature}`;
    Linking.openURL(url);
  }

  function goBack() {
    setCurrentScreen("transactions");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tintColor} />
        <Text style={styles.loadingText}>Loading transaction...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.textColor}
          style={{ opacity: 0.3 }}
        />
        <Text style={styles.emptyTitle}>Transaction Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const details = JSON.parse(transaction.details);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backIconButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Transaction Type & Status Card */}
        <View style={styles.mainCard}>
          <View
            style={[
              styles.iconContainer,
              transaction.status === "success"
                ? styles.successIcon
                : styles.failedIcon,
            ]}
          >
            <Ionicons
              name={getTypeIcon(transaction.type)}
              size={32}
              color={
                transaction.status === "success" ? "#00ff88" : "#ff4444"
              }
            />
          </View>
          <Text style={styles.typeTitle}>{getTypeLabel(transaction.type)}</Text>
          <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              transaction.status === "success"
                ? styles.successBadge
                : styles.failedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                transaction.status === "success"
                  ? styles.successText
                  : styles.failedText,
              ]}
            >
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Transaction Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {Object.entries(details).map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Text>
                <Text style={styles.detailValue} selectable={true}>
                  {typeof value === "string" && value.length > 40
                    ? `${value.slice(0, 20)}...${value.slice(-20)}`
                    : String(value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Signature</Text>
          <View style={styles.signatureCard}>
            <Text style={styles.signatureText} selectable={true}>
              {transaction.signature}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copySignature(transaction.signature)}
            >
              <Ionicons
                name="copy-outline"
                size={20}
                color={theme.tintColor}
              />
              <Text style={styles.actionButtonText}>Copy Signature</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => openSolscan(transaction.signature)}
            >
              <Ionicons
                name="open-outline"
                size={20}
                color={theme.tintTextColor}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextPrimary,
                ]}
              >
                View on Solscan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
      marginBottom: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backIconButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.tintColor,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont,
    },
    mainCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    successIcon: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedIcon: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    typeTitle: {
      fontSize: 24,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
      marginBottom: 16,
    },
    statusBadge: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 16,
    },
    successBadge: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedBadge: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    statusText: {
      fontSize: 13,
      fontFamily: theme.boldFont,
      letterSpacing: 0.5,
    },
    successText: {
      color: "#00ff88",
    },
    failedText: {
      color: "#ff4444",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      opacity: 0.6,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    detailsCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    detailRow: {
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      opacity: 0.7,
      textTransform: "capitalize",
      marginBottom: 6,
    },
    detailValue: {
      fontSize: 15,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      lineHeight: 22,
    },
    signatureCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    signatureText: {
      fontSize: 13,
      color: theme.tintColor,
      fontFamily: theme.regularFont,
      lineHeight: 20,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      gap: 8,
    },
    actionButtonPrimary: {
      backgroundColor: theme.tintColor,
      borderColor: theme.tintColor,
    },
    actionButtonText: {
      fontSize: 14,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
    },
    actionButtonTextPrimary: {
      color: theme.tintTextColor,
    },
  });
