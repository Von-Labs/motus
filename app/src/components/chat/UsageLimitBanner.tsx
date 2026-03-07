import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type UsageLimitBannerProps = {
  theme: any;
};

export function UsageLimitBanner({ theme }: UsageLimitBannerProps) {
  const navigation = useNavigation<any>();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={24} color={theme.tintColor} />
      <Text style={styles.title}>You've used all your free requests</Text>
      <Text style={styles.subtitle}>Deposit USDC to continue chatting</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Usage")}
      >
        <Ionicons name="wallet-outline" size={16} color={theme.tintTextColor} />
        <Text style={styles.buttonText}>Deposit USDC</Text>
      </TouchableOpacity>
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
    button: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    buttonText: {
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont || "Inter-SemiBold",
      fontSize: 14,
    },
  });
