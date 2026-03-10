import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppContext } from "../../context";

type UsageLimitBannerProps = {
  theme: any;
};

export function UsageLimitBanner({ theme }: UsageLimitBannerProps) {
  const navigation = useNavigation<any>();
  const { refreshUsageBalance } = useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);
  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUsageBalance();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={24} color={theme.tintColor} />
      <Text style={styles.title}>You've used all your free requests</Text>
      <Text style={styles.subtitle}>Deposit USDC to continue chatting</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Usage")}
        >
          <Ionicons name="wallet-outline" size={16} color={theme.tintTextColor} />
          <Text style={styles.buttonText}>Deposit USDC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={theme.tintColor} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={theme.tintColor} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      alignItems: "center",
      gap: 6,
    },
    title: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont || "Inter-SemiBold",
      fontSize: 15,
      textAlign: "center",
    },
    subtitle: {
      color: theme.mutedForegroundColor || theme.secondaryTextColor,
      fontFamily: theme.regularFont || "Inter-Regular",
      fontSize: 13,
      textAlign: "center",
    },
    buttons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    button: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    buttonText: {
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont || "Inter-SemiBold",
      fontSize: 14,
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
  });
