export interface Chat {
  id: string;
  created_by: string;
  created_at: string;
  is_public: boolean;
  title: string | null;
}

export interface ChatTask {
  title: string;
  icon: string;
  prompt: string;
}

export type MessageStatus = "loading" | "sent" | "error";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: MessageStatus;
  error?: string;
}

export type ChatId = string;

export type ChatEvent =
  | { type: "tool_start"; tool: string; chat_id: ChatId; tool_icon: string }
  | { type: "tool_end"; tool: string; chat_id: ChatId; tool_icon: string }
  | { type: "token"; content: string; chat_id: ChatId }
  | { type: "final"; message: string; chat_id: ChatId }
  | { type: "error"; message: string };
