import { v4 as uuid } from "uuid";

export type ChatState = {
  messages: Array<{
    user: string;
    assistant?: string;
    toolingSteps?: Array<{ icon: string; text: string }>;
  }>;
  index: string;
  apiMessages: string;
};

export function createEmptyChatState(): ChatState {
  return {
    messages: [],
    index: uuid(),
    apiMessages: "",
  };
}
