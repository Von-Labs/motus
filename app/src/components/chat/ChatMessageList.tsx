import { View, ScrollView, FlatList } from "react-native";
import { ThinkingDots } from "../ThinkingDots";
import { ToolingPanel } from "../ToolingPanel";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatMessageItem, type ChatMessage } from "./ChatMessageItem";
import type { RefObject } from "react";

type ChatMessageListProps = {
  hasMessages: boolean;
  messages: ChatMessage[];
  loading: boolean;
  currentToolingSteps: Array<{ icon: string; text: string }>;
  theme: any;
  scrollViewRef: RefObject<ScrollView | null>;
  contentContainerStyle: (object | false)[];
  layoutStyles: { midChatInputWrapper: object; midChatInputContainer: object };
  onCopyUser: (text: string) => void;
  onAssistantPress: (text: string) => void;
};

export function ChatMessageList({
  hasMessages,
  messages,
  loading,
  currentToolingSteps,
  theme,
  scrollViewRef,
  contentContainerStyle,
  layoutStyles,
  onCopyUser,
  onAssistantPress,
}: ChatMessageListProps) {
  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => (
    <ChatMessageItem
      item={item}
      theme={theme}
      onCopyUser={onCopyUser}
      onAssistantPress={onAssistantPress}
    />
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
      contentContainerStyle={contentContainerStyle}
    >
      {!hasMessages && (
        <ChatEmptyState theme={theme} styles={layoutStyles} />
      )}
      {hasMessages && (
        <FlatList
          data={messages}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
      {currentToolingSteps.length > 0 && (
        <ToolingPanel steps={currentToolingSteps} theme={theme} />
      )}
      {loading && <ThinkingDots theme={theme} />}
    </ScrollView>
  );
}
