import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useContext, useState } from "react";
import { ThemeContext } from "../../context";
import Ionicons from "@expo/vector-icons/Ionicons";

const FEATURES = [
  { icon: "flash-outline", text: "Instant transaction signing" },
  { icon: "lock-closed-outline", text: "Private key stored in device secure enclave" },
  { icon: "wallet-outline", text: "Fund directly from your main wallet" },
  { icon: "trash-outline", text: "Delete anytime — it's a burner" },
] as const;

interface EmptyStateProps {
  onCreate: () => Promise<void>;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="flame-outline" size={48} color={theme.tintColor} />
        </View>

        <Text style={styles.title}>Hot Wallet</Text>
        <Text style={styles.description}>
          Create a burner wallet that lives inside Motus. Transactions are
          signed instantly without switching apps — perfect for fast DeFi
          trading.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.icon} style={styles.featureRow}>
              <Ionicons
                name={feature.icon as any}
                size={18}
                color={theme.tintColor}
              />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={theme.tintTextColor} />
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.tintTextColor}
              />
              <Text style={styles.createButtonText}>Create Hot Wallet</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This wallet is self-custodied. Motus cannot recover lost keys. Only
          deposit what you're willing to lose.
        </Text>
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
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    content: {
      alignItems: "center",
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    featureList: {
      width: "100%",
      marginBottom: 32,
      gap: 14,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 8,
    },
    featureText: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      flex: 1,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.tintColor,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 14,
      gap: 8,
      width: "100%",
      marginBottom: 16,
    },
    createButtonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
    disclaimer: {
      fontSize: 12,
      fontFamily: theme.lightFont,
      color: theme.mutedForegroundColor,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 16,
    },
  });
