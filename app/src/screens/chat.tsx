import { useActionSheet } from "@expo/react-native-action-sheet";
import * as Clipboard from "expo-clipboard";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  View,
} from "react-native";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";
import { ChatInput, ChatMessageList } from "../components";
import { AppContext, ThemeContext } from "../context";
import { getChatType, getEventSource, getFirstNCharsOrLess } from "../utils";
import {
  BLE_PROTOCOL_MESSAGE,
  addBleProtocolListener,
} from "../utils/bluetooth";
import {
  loadConversation,
  saveConversation,
} from "../utils/conversationStorage";
import {
  formatCancelOrderDetails,
  formatSwapDetails,
  formatTriggerOrderDetails,
  handleSwapTransaction,
  handleTriggerTransaction,
  isCancelOrderTransaction,
  isSwapTransaction,
  isTriggerOrderTransaction,
} from "../utils/swapHandler";
import type { ChatState } from "./chat/types";
import { createEmptyChatState } from "./chat/types";
import { getChatStyles } from "./chat/chat.styles";

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
  const {
    chatType,
    walletAddress,
    currentConversationId,
    setCurrentConversationId,
  } = useContext(AppContext);
  const layoutStyles = getChatStyles(theme);

  // Load conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationData(currentConversationId);
    } else {
      // Clear current model's chat state when starting new conversation
      const modelLabel = chatType.label;
      const currentState = getChatState(modelLabel);
      if (currentState.messages.length > 0) {
        updateChatState(modelLabel, () => createEmptyChatState());
      }
    }
  }, [currentConversationId]);

  async function loadConversationData(conversationId: number) {
    try {
      const { conversation, messages } = await loadConversation(conversationId);

      // Clear ALL other models' chat states before loading
      const modelLabel = conversation.model;
      const allModels = Object.keys(chatStates);

      // Clear chat states for models different from the loaded conversation
      allModels.forEach((model) => {
        if (model !== modelLabel) {
          updateChatState(model, () => createEmptyChatState());
        }
      });

      // Load messages into the appropriate model's chat state
      updateChatState(modelLabel, () => ({
        messages,
        index: uuid(),
        apiMessages: "",
      }));
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }

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
      generateClaudeResponse(input);
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
      walletAddress,
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
          // Auto-save conversation after response completes
          autoSaveConversation(messageArray, modelLabel);
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
      walletAddress,
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
          // Auto-save conversation after response completes
          autoSaveConversation(messageArray, modelLabel);
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
      walletAddress,
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

              // Update message array with assistant response
              messageArray[messageArray.length - 1].assistant = localResponse;
              updateChatState(modelLabel, (prev) => ({
                ...prev,
                messages: JSON.parse(JSON.stringify(messageArray)),
              }));
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

          // Update state and save conversation
          updateChatState(modelLabel, (prev) => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray)),
          }));

          // Auto-save with direct data instead of reading from state
          autoSaveConversation(messageArray, modelLabel);
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
    // Start a new conversation
    setCurrentConversationId(null);
  }

  // Auto-save conversation after each message
  // Pass messages directly to avoid state timing issues
  async function autoSaveConversation(messages: any[], model: string) {
    try {
      if (messages.length === 0) {
        return;
      }

      const savedId = await saveConversation(
        currentConversationId,
        messages,
        model,
      );

      // Update conversation ID if this is a new conversation
      if (!currentConversationId && savedId) {
        setCurrentConversationId(savedId);
      }
    } catch (error) {
      console.error("Failed to auto-save conversation:", error);
    }
  }

  const currentChatState = getChatState(chatType.label);
  const callMade = currentChatState.messages.length > 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={layoutStyles.container}
      keyboardVerticalOffset={20}
    >
      <View style={layoutStyles.chatContentWrapper}>
        <ChatMessageList
          hasMessages={callMade}
          messages={currentChatState.messages}
          loading={loading}
          currentToolingSteps={currentToolingSteps}
          theme={theme}
          scrollViewRef={scrollViewRef}
          contentContainerStyle={[
            !callMade && layoutStyles.scrollContentContainer,
            layoutStyles.scrollContentPaddingBottom,
          ]}
          layoutStyles={layoutStyles}
          onCopyUser={copyToClipboard}
          onAssistantPress={showClipboardActionsheet}
        />
        <View style={layoutStyles.chatInputFloating}>
          <ChatInput
            theme={theme}
            value={input}
            onChangeText={setInput}
            onSend={chat}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
