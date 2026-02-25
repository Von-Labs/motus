import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WalletTransaction } from "../utils/database";
import { formatAmountDisplay } from "../utils/transactionHelpers";
import { DOMAIN } from "../../constants";

interface TransactionCardProps {
  transaction: WalletTransaction;
  theme: any;
  onPress: (tx: WalletTransaction) => void;
  formatDate: (timestamp: number | Date) => string;
  getTypeIcon: (type: string) => string;
  getTypeLabel: (type: string) => string;
}

export function TransactionCard({
  transaction,
  theme,
  onPress,
  formatDate,
  getTypeIcon,
  getTypeLabel,
}: TransactionCardProps) {
  const styles = getStyles(theme);
  const details = JSON.parse(transaction.details);
  const [resolvedTokenLabel, setResolvedTokenLabel] = useState<string | null>(null);

  const isSendSplWithoutLabel =
    transaction.type === "send" &&
    details?.type === "spl" &&
    details?.mint &&
    !details?.symbol &&
    !details?.name;

  useEffect(() => {
    if (!isSendSplWithoutLabel || !details.mint) return;
    let cancelled = false;
    fetch(`${DOMAIN}/api/sends/token?mint=${encodeURIComponent(details.mint)}`)
      .then((r) => r.json())
      .then((data: { symbol?: string; name?: string }) => {
        if (cancelled) return;
        const label = data?.name || data?.symbol || null;
        if (label) setResolvedTokenLabel(label);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSendSplWithoutLabel, details?.mint]);

  const amountDisplay =
    isSendSplWithoutLabel && resolvedTokenLabel != null
      ? (() => {
          const raw = Number(details.amount);
          const decimals = typeof details.decimals === "number" ? details.decimals : 6;
          const human = raw / Math.pow(10, decimals);
          const fixed = human >= 1 || human === 0 ? human.toFixed(2) : human.toFixed(4);
          return `${fixed} ${resolvedTokenLabel}`;
        })()
      : formatAmountDisplay(details, transaction.type);

  return (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionTypeContainer}>
          <View
            style={[
              styles.iconContainer,
              transaction.status === "success"
                ? styles.successIcon
                : styles.failedIcon,
            ]}
          >
            <Ionicons
              name={getTypeIcon(transaction.type) as any}
              size={20}
              color={transaction.status === "success" ? "#00ff88" : "#ff4444"}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {getTypeLabel(transaction.type)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>
        </View>
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
            {transaction.status}
          </Text>
        </View>
      </View>

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
          {details.amount != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                {amountDisplay}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.signatureContainer}
        onPress={() => console.log("Signature:", transaction.signature)}
      >
        <Text style={styles.signatureLabel}>Signature:</Text>
        <Text style={styles.signatureValue}>
          {transaction.signature.slice(0, 8)}...
          {transaction.signature.slice(-8)}
        </Text>
        <Ionicons name="open-outline" size={14} color={theme.tintColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
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
