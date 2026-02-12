import {
  StyleSheet, View, TouchableHighlight, Text, Modal, TouchableOpacity
} from 'react-native'
import { useContext, useState } from 'react'
import { MenuIcon } from './MenuIcon'
import { ThemeContext, AppContext } from '../../src/context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMobileWallet } from "@wallet-ui/react-native-web3js"

// Helper to format wallet address: 4 chars...4 chars
const formatWalletAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

interface HeaderProps {
  onMenuPress?: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const { theme } = useContext(ThemeContext)
  const { walletAddress, setWalletAddress } = useContext(AppContext)
  const { disconnect } = useMobileWallet()
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const styles = getStyles(theme)

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setWalletAddress(null)
      setShowDisconnectModal(false)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  return (
    <>
      <View style={styles.container}>
        {/* Hamburger Menu Icon */}
        {onMenuPress && (
          <TouchableHighlight
            style={styles.menuButton}
            underlayColor={'transparent'}
            activeOpacity={0.6}
            onPress={onMenuPress}
          >
            <MenuIcon size={24} color={theme.textColor} />
          </TouchableHighlight>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Wallet Address - Clickable */}
        {walletAddress && (
          <TouchableHighlight
            style={styles.walletBadge}
            underlayColor={theme.tintColor}
            activeOpacity={0.7}
            onPress={() => setShowDisconnectModal(true)}
          >
            <Text style={styles.walletText}>
              {formatWalletAddress(walletAddress)}
            </Text>
          </TouchableHighlight>
        )}
      </View>

      {/* Disconnect Modal */}
      <Modal
        visible={showDisconnectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDisconnectModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Wallet</Text>
              </View>

              <View style={styles.modalWalletInfo}>
                <Ionicons name="wallet-outline" size={24} color={theme.textColor} />
                <Text style={styles.modalWalletAddress}>{walletAddress}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalDisconnectButton}
                onPress={handleDisconnect}
              >
                <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                <Text style={styles.modalDisconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    container: {
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingHorizontal: 15,
    },
    menuButton: {
      padding: 10,
    },
    spacer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      letterSpacing: 1,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    walletBadge: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    walletText: {
      color: theme.tintTextColor,
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      letterSpacing: 0.5,
    },
    buttonContainer: {
      padding: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 16,
      padding: 24,
      width: 320,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    modalHeader: {
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: theme.boldFont,
      color: theme.textColor,
    },
    modalWalletInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.tintColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    modalWalletAddress: {
      fontSize: 14,
      color: theme.tintTextColor,
      fontFamily: theme.regularFont,
      marginLeft: 12,
      flex: 1,
    },
    modalDisconnectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
    },
    modalDisconnectText: {
      fontSize: 16,
      color: '#ff4444',
      fontFamily: theme.semiBoldFont,
      marginLeft: 10,
    },
  })
}