import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "@ronradtke/react-native-markdown-display";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ToolingPanel } from "../ToolingPanel";

export type ChatMessage = {
  user: string;
  assistant?: string;
  toolingSteps?: Array<{ icon: string; text: string }>;
};

type ChatMessageItemProps = {
  item: ChatMessage;
  theme: any;
  onCopyUser: (text: string) => void;
  onAssistantPress: (text: string) => void;
};

export function ChatMessageItem({
  item,
  theme,
  onCopyUser,
  onAssistantPress,
}: ChatMessageItemProps) {
  const styles = getMessageItemStyles(theme);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.promptResponse, animatedStyle]}>
      <View style={styles.promptTextContainer}>
        <View style={styles.promptTextWrapper}>
          <Text style={styles.promptText}>{item.user}</Text>
        </View>
        <TouchableHighlight
          onPress={() => onCopyUser(item.user)}
          underlayColor="transparent"
          style={{ marginTop: 4, padding: 4, alignSelf: "flex-end" }}
        >
          <Ionicons
            name="copy-outline"
            size={14}
            color={theme.textColor}
            opacity={0.5}
          />
        </TouchableHighlight>
      </View>
      {item.toolingSteps && item.toolingSteps.length > 0 && (
        <ToolingPanel steps={item.toolingSteps} theme={theme} />
      )}
      {item.assistant && (
        <View style={styles.assistantMessageContainer}>
          <View style={styles.textStyleContainer}>
            <Markdown style={styles.markdownStyle as any}>
              {item.assistant}
            </Markdown>
            <TouchableHighlight
              onPress={() => onAssistantPress(item.assistant!)}
              underlayColor="transparent"
            >
              <View style={styles.optionsIconWrapper}>
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color={theme.textColor}
                  opacity={0.6}
                />
              </View>
            </TouchableHighlight>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function getMessageItemStyles(theme: any) {
  return StyleSheet.create({
    optionsIconWrapper: {
      padding: 10,
      paddingTop: 9,
      alignItems: "flex-end",
    },
    promptResponse: {
      marginTop: 10,
    },
    promptTextContainer: {
      flex: 1,
      alignItems: "flex-end",
      marginRight: 15,
      marginLeft: 24,
    },
    promptTextWrapper: {
      borderRadius: 8,
      borderTopRightRadius: 0,
      backgroundColor: theme.tintColor,
    },
    promptText: {
      color: theme.tintTextColor,
      fontFamily: theme.regularFont,
      paddingVertical: 5,
      paddingHorizontal: 9,
      fontSize: 16,
    },
    assistantMessageContainer: {
      marginLeft: 16,
      marginRight: 16,
      marginTop: 10,
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      borderRadius: 12,
      borderTopLeftRadius: 4,
      padding: 12,
      paddingRight: 0,
    },
    textStyleContainer: {
      flex: 1,
      paddingVertical: 4,
      paddingLeft: 4,
    },
    markdownStyle: {
      body: {
        color: theme.textColor,
        fontFamily: theme.regularFont,
      },
      paragraph: {
        color: theme.textColor,
        fontSize: 16,
        fontFamily: theme.regularFont,
      },
      heading1: {
        color: theme.textColor,
        fontFamily: theme.semiBoldFont,
        marginVertical: 5,
      },
      heading2: {
        marginTop: 20,
        color: theme.textColor,
        fontFamily: theme.semiBoldFont,
        marginBottom: 5,
      },
      heading3: {
        marginTop: 20,
        color: theme.textColor,
        fontFamily: theme.mediumFont,
        marginBottom: 5,
      },
      heading4: {
        marginTop: 10,
        color: theme.textColor,
        fontFamily: theme.mediumFont,
        marginBottom: 5,
      },
      heading5: {
        marginTop: 10,
        color: theme.textColor,
        fontFamily: theme.mediumFont,
        marginBottom: 5,
      },
      heading6: {
        color: theme.textColor,
        fontFamily: theme.mediumFont,
        marginVertical: 5,
      },
      list_item: {
        marginTop: 7,
        color: theme.textColor,
        fontFamily: theme.regularFont,
        fontSize: 16,
      },
      ordered_list_icon: {
        color: theme.textColor,
        fontSize: 16,
        fontFamily: theme.regularFont,
      },
      bullet_list: { marginTop: 10 },
      ordered_list: { marginTop: 7 },
      bullet_list_icon: {
        color: theme.textColor,
        fontSize: 16,
        fontFamily: theme.regularFont,
      },
      code_inline: {
        color: theme.secondaryTextColor,
        backgroundColor: theme.secondaryBackgroundColor,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, .1)",
        fontFamily: theme.lightFont,
      },
      hr: {
        backgroundColor: theme.borderColor,
        height: 1,
      },
      fence: {
        marginVertical: 5,
        padding: 10,
        color: theme.secondaryTextColor,
        backgroundColor: theme.secondaryBackgroundColor,
        borderColor: theme.borderColor,
        fontFamily: theme.regularFont,
      },
      tr: {
        borderBottomWidth: 1,
        borderColor: theme.borderColor,
        flexDirection: "row",
      },
      table: {
        marginTop: 7,
        borderWidth: 1,
        borderColor: theme.borderColor,
        borderRadius: 6,
      },
      blockquote: {
        backgroundColor: theme.secondaryBackgroundColor,
        borderColor: theme.borderColor,
        borderLeftWidth: 4,
        marginLeft: 5,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginVertical: 8,
      },
    },
  });
}
