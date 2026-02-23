import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";

const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

interface AddressCardProps {
  publicKey: string;
}

export function AddressCard({ publicKey }: AddressCardProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(publicKey);
    Alert.alert("Copied", "Wallet address copied to clipboard.");
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCopy}
      activeOpacity={0.7}
    >
      <View style={styles.labelRow}>
        <Ionicons
          name="key-outline"
          size={18}
          color={theme.mutedForegroundColor}
        />
        <Text style={styles.label}>Address</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{formatAddress(publicKey)}</Text>
        <Ionicons
          name="copy-outline"
          size={16}
          color={theme.mutedForegroundColor}
        />
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 24,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    value: {
      fontSize: 15,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      letterSpacing: 0.3,
    },
  });
