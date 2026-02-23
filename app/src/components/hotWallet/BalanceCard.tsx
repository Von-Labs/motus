import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../context";

const formatSol = (lamports: number) => {
  return (lamports / 1_000_000_000).toFixed(4);
};

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Balance</Text>
      <Text style={styles.amount}>{formatSol(balance)} SOL</Text>
      {balance === 0 && (
        <Text style={styles.hint}>Top up to start signing transactions</Text>
      )}
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 16,
      alignItems: "center",
    },
    label: {
      fontSize: 13,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    amount: {
      fontSize: 36,
      fontFamily: theme.boldFont,
      color: theme.textColor,
    },
    hint: {
      fontSize: 13,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginTop: 8,
    },
  });
