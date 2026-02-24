import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemeContext } from "../../context";
import { useHotWallet } from "../../context/HotWalletContext";

const formatSol = (lamports: number) => {
  return (lamports / 1_000_000_000).toFixed(4);
};

export function HotWalletBanner() {
  const { theme } = useContext(ThemeContext);
  const { isHotWalletActive, balance, publicKey } = useHotWallet();
  const navigation = useNavigation<any>();
  const styles = getStyles(theme);

  if (!isHotWalletActive || !publicKey) return null;

  const formattedAddress = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
  const isLowBalance = (balance ?? 0) < 5_000_000; // < 0.005 SOL

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.getParent?.()?.navigate("HotWallet")}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Ionicons name="flame" size={14} color={theme.tintColor} />
        <Text style={styles.label}>Hot Wallet</Text>
        <Text style={styles.address}>{formattedAddress}</Text>
      </View>
      <View style={styles.right}>
        {isLowBalance && (
          <Ionicons name="warning" size={12} color="#EAB308" />
        )}
        <Text style={[styles.balance, isLowBalance && styles.lowBalance]}>
          {formatSol(balance ?? 0)} SOL
        </Text>
        <Ionicons name="chevron-forward" size={14} color={theme.mutedForegroundColor} />
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    address: {
      fontSize: 11,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    balance: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    lowBalance: {
      color: "#EAB308",
    },
  });
