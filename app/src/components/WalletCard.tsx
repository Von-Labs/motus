import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

interface WalletCardProps {
  walletAddress: string;
  theme: any;
  styles: any;
}

// Helper to format wallet address: 4 chars...4 chars
const formatWalletAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

export function WalletCard({ walletAddress, theme, styles }: WalletCardProps) {
  return (
    <View style={styles.walletSection}>
      <View style={styles.walletCard}>
        <View style={styles.walletIconContainer}>
          <Ionicons name="ellipse" size={12} color={theme.tintColor} />
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Connected Wallet</Text>
          <Text style={styles.walletAddress}>
            {formatWalletAddress(walletAddress)}
          </Text>
        </View>
      </View>
    </View>
  );
}
