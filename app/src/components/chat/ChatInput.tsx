import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";

type ChatInputProps = {
  theme: any;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
};

export function ChatInput({
  theme,
  value,
  onChangeText,
  onSend,
}: ChatInputProps) {
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={20}
      style={styles.wrapper}
    >
      <BlurView
        intensity={80}
        tint="light"
        experimentalBlurMethod={
          Platform.OS === "android" ? "dimezisBlurView" : "none"
        }
        style={styles.container}
      >
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          placeholder="Chat with Motus"
          placeholderTextColor={theme.placeholderTextColor}
          value={value}
          multiline
        />
        <TouchableHighlight
          underlayColor={"transparent"}
          activeOpacity={0.8}
          onPress={onSend}
        >
          <View style={styles.chatButton}>
            <Ionicons
              name="arrow-up-outline"
              size={20}
              color={theme.tintTextColor}
            />
          </View>
        </TouchableHighlight>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      // floating feel
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
      overflow: "hidden",
    },
    input: {
      flex: 1,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: 16,
      paddingVertical: 6,
      paddingRight: 8,
    },
    chatButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: theme.tintColor,
      alignItems: "center",
      justifyContent: "center",
    },
  });
