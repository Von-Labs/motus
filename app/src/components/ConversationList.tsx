import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Conversation } from "../utils/database";

interface ConversationListProps {
  conversations: Conversation[];
  theme: any;
  styles: any;
  onSelectConversation: (conversation: Conversation) => void;
  onViewAllChats: () => void;
}

export function ConversationList({
  conversations,
  theme,
  styles,
  onSelectConversation,
  onViewAllChats,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return null;
  }

  return (
    <View style={styles.conversationsSection}>
      <Text style={styles.sectionTitle}>Recent Chats</Text>
      <ScrollView style={styles.conversationsList}>
        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={styles.conversationItem}
            onPress={() => onSelectConversation(conv)}
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

      <TouchableOpacity style={styles.allChatsButton} onPress={onViewAllChats}>
        <Text style={styles.allChatsText}>View All Chats</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={16}
          color={theme.tintColor}
        />
      </TouchableOpacity>
    </View>
  );
}
