import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useContext, useRef, useEffect, useState } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { getRecentConversations, Conversation } from "../utils/database";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format wallet address: 4 chars...4 chars
const formatWalletAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { theme } = useContext(ThemeContext);
  const { walletAddress, setWalletAddress, setCurrentScreen, setCurrentConversationId } =
    useContext(AppContext);
  const { disconnect } = useMobileWallet();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const styles = getStyles(theme);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Load recent conversations when sidebar opens
    if (isOpen) {
      loadRecentConversations();
    }
  }, [isOpen]);

  async function loadRecentConversations() {
    try {
      const conversations = await getRecentConversations(5);
      console.log('💬 Loaded conversations:', conversations.length);
      console.log('💬 Conversations data:', JSON.stringify(conversations, null, 2));
      setRecentConversations(conversations);
    } catch (error) {
      console.error('Failed to load recent conversations:', error);
    }
  }

  function handleNewChat() {
    setCurrentConversationId(null);
    setCurrentScreen('chat');
    onClose();
  }

  function handleConversationSelect(conversation: Conversation) {
    setCurrentConversationId(conversation.id);
    setCurrentScreen('chat');
    onClose();
  }

  function handleAllChats() {
    setCurrentScreen('allChats');
    onClose();
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWalletAddress(null); // Clear wallet address to return to Welcome screen
      onClose();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </View>

        {/* Wallet Address Section */}
        {walletAddress && (
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
        )}

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <View style={styles.conversationsSection}>
            <Text style={styles.sectionTitle}>Recent Chats</Text>
            <ScrollView style={styles.conversationsList}>
              {recentConversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.conversationItem}
                  onPress={() => handleConversationSelect(conv)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={theme.textColor}
                    style={{ opacity: 0.7 }}
                  />
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                      {conv.title}
                    </Text>
                    <Text style={styles.conversationModel}>{conv.model}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.allChatsButton}
              onPress={handleAllChats}
            >
              <Text style={styles.allChatsText}>View All Chats</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={16}
                color={theme.tintColor}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNewChat}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.textColor}
            />
            <Text style={styles.menuText}>New Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setCurrentScreen("transactions");
              onClose();
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={theme.textColor}
            />
            <Text style={styles.menuText}>Transaction History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setCurrentScreen("settings");
              onClose();
            }}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.textColor}
            />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setCurrentScreen("bluetooth");
              onClose();
            }}
          >
            <Ionicons
              name="bluetooth-outline"
              size={20}
              color={theme.textColor}
            />
            <Text style={styles.menuText}>Bluetooth Lab</Text>
          </TouchableOpacity>
        </View>

        {/* Disconnect Button */}
        {walletAddress && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Ionicons name="log-out-outline" size={20} color="#ff4444" />
              <Text style={styles.disconnectText}>Disconnect Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 999,
    },
    sidebar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 280,
      backgroundColor: theme.backgroundColor,
      borderRightWidth: 1,
      borderRightColor: theme.borderColor,
      zIndex: 1000,
      padding: 20,
      paddingTop: 50,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.boldFont,
      color: theme.textColor,
    },
    closeButton: {
      padding: 5,
    },
    walletSection: {
      marginBottom: 30,
    },
    walletCard: {
      backgroundColor: theme.tintColor,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    walletIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0, 229, 229, 0.15)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    walletInfo: {
      flex: 1,
    },
    walletLabel: {
      fontSize: 12,
      color: theme.tintTextColor,
      fontFamily: theme.lightFont,
      opacity: 0.8,
      marginBottom: 4,
    },
    walletAddress: {
      fontSize: 16,
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont,
      letterSpacing: 1,
    },
    menuSection: {
      flex: 1,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    menuText: {
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      marginLeft: 16,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      paddingTop: 20,
    },
    disconnectButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: "rgba(255, 68, 68, 0.1)",
    },
    disconnectText: {
      fontSize: 16,
      color: "#ff4444",
      fontFamily: theme.semiBoldFont,
      marginLeft: 12,
    },
    conversationsSection: {
      flex: 1,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      opacity: 0.6,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    conversationsList: {
      flex: 1,
      marginBottom: 12,
    },
    conversationItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 6,
      backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    conversationInfo: {
      flex: 1,
      marginLeft: 12,
    },
    conversationTitle: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      marginBottom: 2,
    },
    conversationModel: {
      fontSize: 11,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.5,
    },
    allChatsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    allChatsText: {
      fontSize: 14,
      color: theme.tintColor,
      fontFamily: theme.mediumFont,
    },
  });
