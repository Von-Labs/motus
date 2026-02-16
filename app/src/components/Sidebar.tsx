import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useContext, useRef, useEffect, useState } from "react";
import { ThemeContext, AppContext } from "../context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { getRecentConversations, Conversation } from "../utils/database";
import { getStyles } from "./Sidebar.styles";
import { WalletCard } from "./WalletCard";
import { ConversationList } from "./ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

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
          <WalletCard
            walletAddress={walletAddress}
            theme={theme}
            styles={styles}
          />
        )}

        {/* Recent Conversations */}
        <ConversationList
          conversations={recentConversations}
          theme={theme}
          styles={styles}
          onSelectConversation={handleConversationSelect}
          onViewAllChats={handleAllChats}
        />

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
              setCurrentScreen("usage");
              onClose();
            }}
          >
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={theme.textColor}
            />
            <Text style={styles.menuText}>Usage & Billing</Text>
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
