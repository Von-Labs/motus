import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import "react-native-get-random-values";
import { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext, AppContext } from "../context";
import { getEventSource, getFirstNCharsOrLess, getChatType } from "../utils";
import {
  BLE_PROTOCOL_MESSAGE,
  addBleProtocolListener,
} from "../utils/bluetooth";
import { v4 as uuid } from "uuid";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Markdown from "@ronradtke/react-native-markdown-display";
import {
  handleSwapTransaction,
  isSwapTransaction,
  formatSwapDetails,
  handleTriggerTransaction,
  isTriggerOrderTransaction,
  isCancelOrderTransaction,
  formatTriggerOrderDetails,
  formatCancelOrderDetails,
} from "../utils/swapHandler";
import {
  DefiAIIcon,
  ThinkingDots,
  ToolingPanel,
  EmptyStateText,
} from "../components";

type ChatState = {
  messages: Array<{
    user: string;
    assistant?: string;
    toolingSteps?: Array<{ icon: string; text: string }>;
  }>;
  index: string;
  apiMessages: string;
};

const createEmptyChatState = (): ChatState => ({
  messages: [],
  index: uuid(),
  apiMessages: "",
});

export function Chat() {
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  // Track pending swap transaction
  const [pendingSwap, setPendingSwap] = useState<any>(null);

  // Track current tooling steps while loading
  const [currentToolingSteps, setCurrentToolingSteps] = useState<
    Array<{ icon: string; text: string }>
  >([]);

  // Force re-render counter for real-time tooling updates
  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  // Per-model chat state - each model has its own conversation history
  const [chatStates, setChatStates] = useState<Record<string, ChatState>>({});

  // Helper to get or create chat state for current model
  const getChatState = (modelLabel: string): ChatState => {
    return chatStates[modelLabel] || createEmptyChatState();
  };

  // Helper to update chat state for a specific model
  const updateChatState = (
    modelLabel: string,
    updater: (prev: ChatState) => ChatState,
  ) => {
    setChatStates((prev) => ({
      ...prev,
      [modelLabel]: updater(prev[modelLabel] || createEmptyChatState()),
    }));
  };

  const { theme } = useContext(ThemeContext);
  const { chatType, walletAddress } = useContext(AppContext);
  const styles = getStyles(theme);

  useEffect(() => {
    const subscription = addBleProtocolListener((event) => {
      if (
        event.type === BLE_PROTOCOL_MESSAGE.DESKTOP_CHAT_INPUT &&
        typeof event.message === "string" &&
        event.message.length > 0
      ) {
        setInput(event.message);
        Keyboard.dismiss();
        setTimeout(() => {
          generateClaudeResponse(event.message);
        }, 500);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function chat() {
    if (!input) return;
    Keyboard.dismiss();

    // Clear any previous tooling steps
    setCurrentToolingSteps([]);

    if (chatType.label.includes("claude")) {
      generateClaudeResponse();
    } else if (chatType.label.includes("gpt")) {
      generateGptResponse();
    } else if (chatType.label.includes("gemini")) {
      generateGeminiResponse();
    }
  }
  async function generateGptResponse() {
    if (!input) return;
    Keyboard.dismiss();
    let localResponse = "";
    const modelLabel = chatType.label;
    const currentState = getChatState(modelLabel);

    let messageArray = [
      ...currentState.messages,
      {
        user: input,
      },
    ] as [{ user: string; assistant?: string }];

    updateChatState(modelLabel, (prev) => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray)),
    }));

    setLoading(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 1);
    setInput("");

    const messages = messageArray.reduce((acc: any[], message) => {
      acc.push({ role: "user", content: message.user });
      if (message.assistant) {
        acc.push({ role: "assistant", content: message.assistant });
      }
      return acc;
    }, []);

    const eventSourceArgs = {
      body: {
        messages,
        model: chatType.label,
      },
      type: getChatType(chatType),
    };

    const es = await getEventSource(eventSourceArgs);

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.");
        setLoading(false);
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true,
            });
          }
          const data = JSON.parse(event.data);
          if (typeof data === "string") {
            localResponse = localResponse + data;
          } else if (data?.content) {
            localResponse = localResponse + data.content;
          }
          messageArray[messageArray.length - 1].assistant = localResponse;
          updateChatState(modelLabel, (prev) => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray)),
          }));
        } else {
          setLoading(false);
          es.close();
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message);
        setLoading(false);
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error);
        setLoading(false);
      }
    };

    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }
  async function generateGeminiResponse() {
    if (!input) return;
    Keyboard.dismiss();
    let localResponse = "";
    const modelLabel = chatType.label;
    const currentState = getChatState(modelLabel);
    const geminiInput = `${input}`;

    let messageArray = [
      ...currentState.messages,
      {
        user: input,
      },
    ] as [{ user: string; assistant?: string }];

    updateChatState(modelLabel, (prev) => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray)),
    }));

    setLoading(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 1);
    setInput("");

    const eventSourceArgs = {
      body: {
        prompt: geminiInput,
        model: chatType.label,
      },
      type: getChatType(chatType),
    };

    const es = await getEventSource(eventSourceArgs);

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.");
        setLoading(false);
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true,
            });
          }

          const data = event.data;
          localResponse = localResponse + JSON.parse(data);
          messageArray[messageArray.length - 1].assistant = localResponse;
          updateChatState(modelLabel, (prev) => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray)),
          }));
        } else {
          setLoading(false);
          updateChatState(modelLabel, (prev) => ({
            ...prev,
            apiMessages: `${prev.apiMessages}\n\nPrompt: ${input}\n\nResponse:${localResponse}`,
          }));
          es.close();
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message);
        setLoading(false);
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error);
        setLoading(false);
      }
    };

    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }

  async function generateClaudeResponse(input) {
    // if (!input) return;
    Keyboard.dismiss();
    let localResponse = "";
    const modelLabel = chatType.label;
    const currentState = getChatState(modelLabel);

    // Track tooling steps locally to avoid state timing issues
    let localToolingSteps: Array<{ icon: string; text: string }> = [];

    // Build messages array for claude-tools endpoint
    const messages = currentState.messages.reduce((acc: any[], message) => {
      acc.push({ role: "user", content: message.user });
      if (message.assistant) {
        acc.push({ role: "assistant", content: message.assistant });
      }
      return acc;
    }, []);

    // Add current message
    messages.push({ role: "user", content: input });

    let messageArray = [
      ...currentState.messages,
      {
        user: input,
      },
    ] as [
      {
        user: string;
        assistant?: string;
        toolingSteps?: Array<{ icon: string; text: string }>;
      },
    ];

    updateChatState(modelLabel, (prev) => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray)),
    }));

    setLoading(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 1);
    setInput("");

    // Build system prompt with wallet address if available
    let systemPrompt: string | undefined = undefined;
    if (walletAddress) {
      systemPrompt = `You are a helpful DeFi assistant. The user's wallet address is: ${walletAddress}

When the user asks to swap tokens, use this wallet address as the userPublicKey parameter.
Always confirm the wallet address before performing any transactions.`;
    }

    // Use claude-tools endpoint for Jupiter integration
    const eventSourceArgs = {
      body: {
        messages,
        model: chatType.label,
        systemPrompt,
      },
      type: "claude-tools", // Use claude-tools endpoint
    };

    const es = await getEventSource(eventSourceArgs);

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.");
        // Keep loading true to show tooling panel and thinking dots
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true,
            });
          }
          try {
            const data = JSON.parse(event.data);

            // Handle different response types
            if (data.type === "text") {
              // Text response from Claude
              localResponse = localResponse + data.text;
            } else if (data.type === "tool_use") {
              // Tool is being used - add to tooling steps and hide from main text
              const toolIcon =
                data.name === "get_token_price"
                  ? "globe-outline"
                  : data.name === "swap_tokens"
                    ? "swap-horizontal-outline"
                    : data.name === "get_wallet_balance"
                      ? "wallet-outline"
                      : "construct-outline";

              const toolText = data.name
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

              // Add to local array
              const newStep = { icon: toolIcon, text: toolText };
              localToolingSteps.push(newStep);

              // Use requestAnimationFrame to ensure state update happens
              requestAnimationFrame(() => {
                setCurrentToolingSteps([...localToolingSteps]);
                setRenderTrigger((prev) => prev + 1);
              });

              // Don't show in main response text - only in tooling panel
            } else if (data.type === "tool_result") {
              // Tool completed - don't show "Done" text, already visible in tooling panel

              // Check if this is a swap transaction
              if (
                data.name === "swap_tokens" &&
                isSwapTransaction(data.result)
              ) {
                console.log(
                  "Swap transaction detected, prompting user to sign...",
                );

                // Show swap details
                localResponse =
                  localResponse + formatSwapDetails(data.result) + "\n\n";

                // Store pending swap
                setPendingSwap(data.result);

                // Auto-execute swap transaction
                handleSwapTransaction(data.result)
                  .then((signature) => {
                    console.log("Swap executed:", signature);
                    localResponse =
                      localResponse +
                      `✅ **Swap executed!**\n\nTransaction: [${signature.slice(0, 8)}...${signature.slice(-8)}](https://solscan.io/tx/${signature})\n\n`;

                    // Update message with signature
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));

                    setPendingSwap(null);
                  })
                  .catch((error) => {
                    console.error("Swap failed:", error);
                    localResponse =
                      localResponse +
                      `❌ **Swap failed:** ${error.message}\n\n`;

                    // Update message with error
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));

                    setPendingSwap(null);
                  });
              }

              // Check if this is a trigger order transaction (create limit order)
              if (
                data.name === "create_trigger_order" &&
                isTriggerOrderTransaction(data.result)
              ) {
                console.log(
                  "Trigger order transaction detected, prompting user to sign...",
                );

                // Show order details
                localResponse =
                  localResponse +
                  formatTriggerOrderDetails(data.result) +
                  "\n\n";

                // Auto-execute trigger order transaction
                handleTriggerTransaction(data.result)
                  .then((signature) => {
                    console.log("Trigger order created:", signature);
                    localResponse =
                      localResponse +
                      `✅ **Limit order created!**\n\nTransaction: [${signature.slice(0, 8)}...${signature.slice(-8)}](https://solscan.io/tx/${signature})\n\nYour order is now active and will execute automatically when the target price is reached.\n\n`;

                    // Update message with signature
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));
                  })
                  .catch((error) => {
                    console.error("Trigger order failed:", error);
                    localResponse =
                      localResponse +
                      `❌ **Order creation failed:** ${error.message}\n\n`;

                    // Update message with error
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));
                  });
              }

              // Check if this is a cancel order transaction
              if (
                (data.name === "cancel_trigger_order" ||
                  data.name === "cancel_all_trigger_orders") &&
                isCancelOrderTransaction(data.result)
              ) {
                console.log(
                  "Cancel order transaction detected, prompting user to sign...",
                );

                // Show cancel details
                localResponse =
                  localResponse +
                  formatCancelOrderDetails(data.result) +
                  "\n\n";

                // Auto-execute cancel transaction
                handleTriggerTransaction(data.result)
                  .then((signature) => {
                    console.log("Order cancelled:", signature);
                    localResponse =
                      localResponse +
                      `✅ **Order(s) cancelled!**\n\nTransaction: [${signature.slice(0, 8)}...${signature.slice(-8)}](https://solscan.io/tx/${signature})\n\n`;

                    // Update message with signature
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));
                  })
                  .catch((error) => {
                    console.error("Cancel order failed:", error);
                    localResponse =
                      localResponse +
                      `❌ **Cancellation failed:** ${error.message}\n\n`;

                    // Update message with error
                    messageArray[messageArray.length - 1].assistant =
                      localResponse;
                    updateChatState(modelLabel, (prev) => ({
                      ...prev,
                      messages: JSON.parse(JSON.stringify(messageArray)),
                    }));
                  });
              }
            } else if (data.type === "error") {
              // Error occurred
              localResponse = localResponse + `\n❌ Error: ${data.error}\n`;
            } else if (data.text) {
              // Fallback for old format
              localResponse = localResponse + data.text;
            }

            messageArray[messageArray.length - 1].assistant = localResponse;
            updateChatState(modelLabel, (prev) => ({
              ...prev,
              messages: JSON.parse(JSON.stringify(messageArray)),
            }));
          } catch (err) {
            console.log("Parse error:", err);
          }
        } else {
          // Update the last message with the final tooling steps from local array
          if (localToolingSteps.length > 0) {
            messageArray[messageArray.length - 1].toolingSteps = [
              ...localToolingSteps,
            ];
            updateChatState(modelLabel, (prev) => ({
              ...prev,
              messages: JSON.parse(JSON.stringify(messageArray)),
              apiMessages: `${prev.apiMessages}\n\nHuman: ${input}\n\nAssistant:${getFirstNCharsOrLess(localResponse, 2000)}`,
            }));
          } else {
            updateChatState(modelLabel, (prev) => ({
              ...prev,
              apiMessages: `${prev.apiMessages}\n\nHuman: ${input}\n\nAssistant:${getFirstNCharsOrLess(localResponse, 2000)}`,
            }));
          }

          setLoading(false);
          setCurrentToolingSteps([]); // Clear tooling steps when done
          es.close();
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message);
        setLoading(false);
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error);
        setLoading(false);
      }
    };
    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }

  async function copyToClipboard(text) {
    await Clipboard.setStringAsync(text);
  }

  async function showClipboardActionsheet(text) {
    const cancelButtonIndex = 2;
    showActionSheetWithOptions(
      {
        options: ["Copy to clipboard", "Clear chat", "cancel"],
        cancelButtonIndex,
      },
      (selectedIndex) => {
        if (selectedIndex === Number(0)) {
          copyToClipboard(text);
        }
        if (selectedIndex === 1) {
          clearChat();
        }
      },
    );
  }

  async function clearChat() {
    if (loading) return;
    const modelLabel = chatType.label;
    updateChatState(modelLabel, () => createEmptyChatState());
  }

  function renderItem({ item, index }: { item: any; index: number }) {
    return (
      <View style={styles.promptResponse} key={index}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            <Text style={styles.promptText}>{item.user}</Text>
          </View>
          <TouchableHighlight
            onPress={() => copyToClipboard(item.user)}
            underlayColor={"transparent"}
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
            <View style={styles.assistantIconContainer}>
              <DefiAIIcon size={32} />
            </View>
            <View style={styles.textStyleContainer}>
              <Markdown style={styles.markdownStyle as any}>
                {item.assistant}
              </Markdown>
              <TouchableHighlight
                onPress={() => copyToClipboard(item.assistant)}
                underlayColor={"transparent"}
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
      </View>
    );
  }

  const currentChatState = getChatState(chatType.label);
  const callMade = currentChatState.messages.length > 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        contentContainerStyle={!callMade && styles.scrollContentContainer}
      >
        {!callMade && (
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
        )}
        {callMade && (
          <FlatList
            data={currentChatState.messages}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}
        {/* Show tooling panel whenever there are steps, regardless of loading state */}
        {currentToolingSteps.length > 0 && (
          <ToolingPanel steps={currentToolingSteps} theme={theme} />
        )}
        {loading && <ThinkingDots theme={theme} />}
      </ScrollView>
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.input}
          onChangeText={(v) => setInput(v)}
          placeholder="Chat with Claude"
          placeholderTextColor={theme.placeholderTextColor}
          value={input}
        />
        <TouchableHighlight
          underlayColor={"transparent"}
          activeOpacity={0.65}
          onPress={chat}
        >
          <View style={styles.chatButton}>
            <Ionicons
              name="arrow-up-outline"
              size={20}
              color={theme.tintTextColor}
            />
          </View>
        </TouchableHighlight>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    optionsIconWrapper: {
      padding: 10,
      paddingTop: 9,
      alignItems: "flex-end",
    },
    scrollContentContainer: {
      flex: 1,
    },
    chatDescription: {
      color: theme.textColor,
      textAlign: "center",
      marginTop: 15,
      fontSize: 13,
      paddingHorizontal: 34,
      opacity: 0.8,
      fontFamily: theme.regularFont,
    },
    midInput: {
      marginBottom: 8,
      borderWidth: 1,
      paddingHorizontal: 25,
      marginHorizontal: 10,
      paddingVertical: 15,
      borderRadius: 99,
      color: theme.textColor,
      borderColor: theme.borderColor,
      fontFamily: theme.mediumFont,
    },
    midButtonStyle: {
      flexDirection: "row",
      marginHorizontal: 14,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 99,
      backgroundColor: theme.tintColor,
      justifyContent: "center",
      alignItems: "center",
    },
    midButtonText: {
      color: theme.tintTextColor,
      marginLeft: 10,
      fontFamily: theme.boldFont,
      fontSize: 16,
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
    loadingContainer: {
      marginTop: 25,
    },
    promptResponse: {
      marginTop: 10,
    },
    assistantMessageContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginLeft: 10,
      marginRight: 25,
      marginTop: 10,
    },
    assistantIconContainer: {
      marginRight: 10,
      marginTop: 5,
    },
    textStyleContainer: {
      flex: 1,
      padding: 15,
      paddingBottom: 6,
      paddingTop: 5,
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
    chatButton: {
      marginRight: 14,
      padding: 5,
      borderRadius: 99,
      backgroundColor: theme.tintColor,
    },
    chatInputContainer: {
      paddingTop: 5,
      borderColor: theme.borderColor,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 5,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 99,
      color: theme.textColor,
      marginHorizontal: 10,
      paddingVertical: 10,
      paddingHorizontal: 21,
      paddingRight: 39,
      borderColor: theme.borderColor,
      fontFamily: theme.semiBoldFont,
    },
    container: {
      backgroundColor: theme.backgroundColor,
      flex: 1,
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
      bullet_list: {
        marginTop: 10,
      },
      ordered_list: {
        marginTop: 7,
      },
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
        backgroundColor: "rgba(255, 255, 255, .1)",
        height: 1,
      },
      fence: {
        marginVertical: 5,
        padding: 10,
        color: theme.secondaryTextColor,
        backgroundColor: theme.secondaryBackgroundColor,
        borderColor: "rgba(255, 255, 255, .1)",
        fontFamily: theme.regularFont,
      },
      tr: {
        borderBottomWidth: 1,
        borderColor: "rgba(255, 255, 255, .2)",
        flexDirection: "row",
      },
      table: {
        marginTop: 7,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, .2)",
        borderRadius: 3,
      },
      blockquote: {
        backgroundColor: "#312e2e",
        borderColor: "#CCC",
        borderLeftWidth: 4,
        marginLeft: 5,
        paddingHorizontal: 5,
        marginVertical: 5,
      },
    } as any,
  });
