import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useContext, useState } from "react";
import { ThemeContext } from "../../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BalanceCard } from "./BalanceCard";
import { AddressCard } from "./AddressCard";
import { ActionRow } from "./ActionRow";
import { PrivateKeyReveal } from "./PrivateKeyReveal";

const formatSol = (lamports: number) => {
  return (lamports / 1_000_000_000).toFixed(4);
};

interface WalletDashboardProps {
  publicKey: string;
  balance: number;
  onDelete: () => void;
  onTopUp: () => void;
  onSend: () => void;
}

export function WalletDashboard({
  publicKey,
  balance,
  onDelete,
  onTopUp,
  onSend,
}: WalletDashboardProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleExportKey = () => {
    Alert.alert(
      "Export Private Key",
      "This will reveal your private key. Anyone with this key has full control of this wallet. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Show Key",
          style: "destructive",
          onPress: () => {
            setShowPrivateKey(true);
            setTimeout(() => setShowPrivateKey(false), 30000);
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Hot Wallet",
      balance > 0
        ? `You still have ${formatSol(balance)} SOL in this wallet. Deleting the wallet will make these funds unrecoverable. Are you sure?`
        : "This will permanently delete your hot wallet. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="flame" size={24} color={theme.tintColor} />
          <Text style={styles.headerTitle}>Hot Wallet</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <BalanceCard balance={balance} />
      <AddressCard publicKey={publicKey} />

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <ActionRow
          icon="arrow-down-outline"
          iconColor="#16A34A"
          iconBgColor="rgba(22, 163, 74, 0.12)"
          title="Top Up"
          subtitle="Transfer SOL from main wallet"
          onPress={onTopUp}
        />
        <ActionRow
          icon="arrow-up-outline"
          iconColor="#6366F1"
          iconBgColor="rgba(99, 102, 241, 0.12)"
          title="Send SOL"
          subtitle="Send to any Solana address"
          onPress={onSend}
        />
      </View>

      {/* Advanced */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <ActionRow
          icon="eye-outline"
          iconColor="#EAB308"
          iconBgColor="rgba(234, 179, 8, 0.12)"
          title="Export Private Key"
          subtitle="Reveal key (visible for 30s)"
          onPress={handleExportKey}
        />
        {showPrivateKey && (
          <PrivateKeyReveal privateKey="5Kd3NBUAdUnhyzenEwVLy9pBKxSwXvE9FMPyR4UKZwEzaqGfBLH8..." />
        )}
        <ActionRow
          icon="trash-outline"
          iconColor="#DC2626"
          iconBgColor="rgba(220, 38, 38, 0.12)"
          title="Delete Wallet"
          titleColor="#DC2626"
          subtitle="Permanently remove hot wallet"
          onPress={handleDelete}
          showChevron={false}
          destructive
        />
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    content: {
      padding: 20,
      paddingBottom: 60,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: theme.boldFont,
      color: theme.textColor,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(22, 163, 74, 0.12)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#16A34A",
    },
    statusText: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      color: "#16A34A",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: theme.semiBoldFont,
      color: theme.mutedForegroundColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
  });
