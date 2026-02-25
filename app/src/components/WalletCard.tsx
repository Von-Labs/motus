import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { truncateAddress } from "../utils/formatAddress";

interface WalletCardProps {
  walletAddress: string;
  theme: any;
  styles: any;
}

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
            {truncateAddress(walletAddress)}
          </Text>
        </View>
      </View>
    </View>
  );
}
