import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useContext, useState, useEffect } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getWalletTransactionById, WalletTransaction } from "../utils/database";
import { formatDate, getTypeIcon, getTypeLabel } from "../utils/transactionHelpers";
import { getStyles } from "./transactionDetail.styles";

type TransactionDetailParams = { transactionId?: number };

export function TransactionDetail() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute();
  const navigation = useNavigation();
  const transactionId = (route.params as TransactionDetailParams)?.transactionId;
  const styles = getStyles(theme);
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  async function loadTransaction() {
    if (transactionId == null) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tx = await getWalletTransactionById(transactionId);
      setTransaction(tx);
    } catch (error) {
      console.error("Failed to load transaction:", error);
    } finally {
      setLoading(false);
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
    navigation.goBack();
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
