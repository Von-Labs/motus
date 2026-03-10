import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppContext, ThemeContext } from "../context";
import { useAlert } from "../context/AlertContext";
import {
  Conversation,
  deleteConversation,
  getAllConversations,
} from "../utils/database";

export function AllChats() {
  const { theme } = useContext(ThemeContext);
  const { setCurrentConversationId, currentConversationId } =
    useContext(AppContext);
  const { showAlert } = useAlert();
  const navigation = useNavigation();
  const styles = getStyles(theme);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllConversations();
  }, []);

  async function loadAllConversations() {
    try {
      setLoading(true);
      const allConversations = await getAllConversations();
      setConversations(allConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleConversationPress(conversation: Conversation) {
    setCurrentConversationId(conversation.id);
    (navigation as any).navigate("Home");
  }

  function handleDeleteConversation(conversation: Conversation) {
    showAlert({
      title: "Delete Conversation",
      message: `Are you sure you want to delete "${conversation.title}"?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversation.id);
              if (currentConversationId === conversation.id) {
                setCurrentConversationId(null);
              }
              loadAllConversations();
            } catch (error) {
              console.error("Failed to delete conversation:", error);
            }
          },
        },
      ],
    });
  }

  function formatDate(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  }

  function renderConversationItem({ item }: { item: Conversation }) {
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.conversationIconContainer}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.tintColor}
            />
          </View>
          <View style={styles.conversationContent}>
            <Text style={styles.conversationTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.conversationMeta}>
              <Text style={styles.conversationModel}>{item.model}</Text>
              <Text style={styles.conversationDate}>
                {formatDate(item.updatedAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteConversation(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Conversations List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubbles-outline"
            size={64}
            color={theme.textColor}
            style={{ opacity: 0.3 }}
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    placeholder: {
      width: 40,
    },
    listContainer: {
      padding: 16,
    },
    conversationCard: {
      backgroundColor:
        theme.secondaryBackgroundColor || "rgba(255, 255, 255, 0.05)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    conversationHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    conversationIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0, 229, 229, 0.15)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    conversationContent: {
      flex: 1,
    },
    conversationTitle: {
      fontSize: 16,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      marginBottom: 6,
    },
    conversationMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    conversationModel: {
      fontSize: 12,
      fontFamily: theme.lightFont,
      color: theme.tintColor,
      opacity: 0.8,
    },
    conversationDate: {
      fontSize: 12,
      fontFamily: theme.lightFont,
      color: theme.textColor,
      opacity: 0.5,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginTop: 16,
      opacity: 0.6,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      marginTop: 8,
      opacity: 0.4,
    },
  });
