import { StyleSheet } from "react-native";

export function getChatStyles(theme: any) {
  return StyleSheet.create({
    container: {
      backgroundColor: "transparent",
      flex: 1,
    },
    chatContentWrapper: {
      flex: 1,
    },
    scrollContentContainer: {
      flex: 1,
    },
    scrollContentPaddingBottom: {
      paddingBottom: 100,
    },
    chatInputFloating: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
    },
    midChatInputWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    midChatInputContainer: {
      width: "100%",
      paddingTop: 5,
      paddingBottom: 5,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
