import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useContext, useEffect, useState } from "react";
import { ThemeContext, AppContext } from "../context";
import { useHotWallet } from "../context/HotWalletContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { getRecentConversations, Conversation } from "../utils/database";
import { getStyles } from "./Sidebar.styles";
import { WalletCard } from "./WalletCard";
import { ConversationList } from "./ConversationList";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

export function Sidebar(props: DrawerContentComponentProps) {
  const { theme } = useContext(ThemeContext);
  const {
    walletAddress,
    setWalletAddress,
    setCurrentConversationId,
    setOnboardingCompleted,
  } =
    useContext(AppContext);
  const { isHotWalletFeatureEnabled, isHotWalletActive, deleteHotWallet } =
    useHotWallet();
  const { disconnect } = useMobileWallet();
  const styles = getStyles(theme);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadRecentConversations();
  }, []);

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
    props.navigation.navigate("Home");
    props.navigation.closeDrawer();
  }

  function handleConversationSelect(conversation: Conversation) {
    setCurrentConversationId(conversation.id);
    props.navigation.navigate("Home");
    props.navigation.closeDrawer();
  }

  function handleAllChats() {
    props.navigation.navigate("AllChats");
    props.navigation.closeDrawer();
  }

  const performLogout = async (deleteHotWalletToo: boolean) => {
    try {
      if (deleteHotWalletToo && isHotWalletActive) {
        await deleteHotWallet();
      }
      await disconnect().catch(() => {});
      setWalletAddress(null);
      setOnboardingCompleted(false);
      setCurrentConversationId(null);
      props.navigation.closeDrawer();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleDisconnect = () => {
    if (isHotWalletActive) {
      Alert.alert(
        "Logout",
        "Do you also want to delete your hot wallet?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Keep hot wallet",
            onPress: () => {
              performLogout(false);
            },
          },
          {
            text: "Delete hot wallet",
            style: "destructive",
            onPress: () => {
              performLogout(true);
            },
          },
        ],
      );
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          performLogout(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.sidebar}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity onPress={props.navigation.closeDrawer} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                props.navigation.navigate("NewsFeed");
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons
                name="newspaper-outline"
                size={20}
                color={theme.textColor}
              />
              <Text style={styles.menuText}>News Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                props.navigation.navigate("Send");
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons
                name="send-outline"
                size={20}
                color={theme.textColor}
              />
              <Text style={styles.menuText}>Send token</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                props.navigation.navigate("Usage");
                props.navigation.closeDrawer();
              }}
            >
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color={theme.textColor}
              />
              <Text style={styles.menuText}>Usage & Billing</Text>
            </TouchableOpacity>

            {isHotWalletFeatureEnabled && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  props.navigation.closeDrawer();
                  (props.navigation.getParent() as any)?.navigate("HotWallet");
                }}
              >
                <Ionicons
                  name="flame-outline"
                  size={20}
                  color={theme.textColor}
                />
                <Text style={styles.menuText}>Hot Wallet</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                props.navigation.navigate("Transactions");
                props.navigation.closeDrawer();
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
                props.navigation.closeDrawer();
                (props.navigation.getParent() as any)?.navigate("Settings");
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
                props.navigation.navigate("Bluetooth");
                props.navigation.closeDrawer();
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
        </ScrollView>

        {/* Disconnect Button */}
        {(walletAddress || isHotWalletActive) && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Ionicons name="log-out-outline" size={20} color="#ff4444" />
              <Text style={styles.disconnectText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
}
