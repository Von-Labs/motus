import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { EmptyStateText } from "./EmptyStateText";

type ChatEmptyStateProps = {
  theme: any;
  styles: {
    midChatInputWrapper: object;
    midChatInputContainer: object;
  };
};

export function ChatEmptyState({ theme, styles }: ChatEmptyStateProps) {
  return (
    <View style={styles.midChatInputWrapper}>
      <View style={styles.midChatInputContainer}>
        <Ionicons
          name="chatbox-ellipses-outline"
          size={48}
          color={theme.tintColor}
        />
        <EmptyStateText
          text="How can I help you this evening?"
          theme={theme}
        />
      </View>
    </View>
  );
}
