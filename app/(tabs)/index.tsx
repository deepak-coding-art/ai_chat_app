import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { streamChat } from '@/lib/api';
import { Message } from '@/lib/types';
import { Send } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;
    const newMessageID = Date.now().toString();

    const newMessage: Message = {
      role: "user",
      content: inputText,
      id: newMessageID,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    const draftAssistantId = `${newMessageID}-assistant`;
    // Add a draft assistant message to stream into
    setMessages(prev => [
      ...prev,
      { id: draftAssistantId, role: "assistant", content: "" },
    ]);

    try {
      await streamChat(
        { message: newMessage.content, chat_id: chatId },
        {
          onEvent: (event) => {
            // Persist chat id once it is known
            if ((event as any).chat_id && !chatId) {
              setChatId((event as any).chat_id);
            }

            if (event.type === "token") {
              const token = extractText(event.content);
              setMessages(prev => {
                // Append token to the latest assistant draft
                return prev.map(m =>
                  m.id === draftAssistantId ? { ...m, content: m.content + token } : m
                );
              });
            } else if (event.type === "final") {
              // Ensure final message is set (in case no tokens streamed)
              const finalText = extractText(event.message);
              setMessages(prev => prev.map(m =>
                m.id === draftAssistantId && finalText
                  ? { ...m, content: finalText }
                  : m
              ));
              // Update chat id
              if (event.chat_id) setChatId(event.chat_id);
            }
            // Tool events can be shown as inline status if desired; ignoring for now

          },
        }
      );
    } catch (err) {
      // Show error as assistant message
      console.error(err)
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => prev.map(m =>
        m.id === draftAssistantId ? { ...m, content: `Error: ${message}` } : m
      ));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView className="flex-1">
        {/* Messages */}
        <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
            <MessageBox key={message.id} message={message} />
          ))}
        </ScrollView>

        {/* Input */}
        <ChatInput inputText={inputText} setInputText={setInputText} handleSendMessage={handleSendMessage} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}


const MessageBox = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <View
      className={`flex-row items-end mb-4 mx-2 ${isUser ? 'justify-end' : 'justify-start'
        }`}
    >

      <View
        className={`max-w-[80%] p-3 rounded-lg ${isUser
          ? 'bg-secondary-200 rounded-br-sm'
          : 'bg-secondary-100 rounded-bl-sm'
          }`}
      >
        <ThemedText
          className={`text-sm ${isUser ? 'text-white' : 'text-typography-900'
            }`}
        >
          {message.content}
        </ThemedText>

      </View>

    </View>
  )
}

// Extract plain text from various possible event payload shapes
function extractText(input: unknown): string {
  if (typeof input === 'string') return input;
  if (!input) return '';
  // Handle LangChain-style content arrays [{ type: 'text', text: { value } }, ...]
  if (Array.isArray(input)) {
    return input
      .map((part) => extractText(part))
      .join('');
  }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    // Common shapes
    if (typeof obj.text === 'string') return obj.text;
    if (obj.text && typeof (obj.text as any).value === 'string') return (obj.text as any).value;
    if (typeof obj.value === 'string') return obj.value;
    if (typeof obj.content === 'string') return obj.content;
    // Fallback: avoid dumping JSON, return empty
    return '';
  }
  return '';
}

const ChatInput = ({ inputText, setInputText, handleSendMessage }: { inputText: string, setInputText: (text: string) => void, handleSendMessage: () => void }) => {
  return (
    <View className="bg-background-50 p-4 border-t border-outline-200">
      <View className="flex-row items-end">
        <TextInput
          className="flex-1 border border-outline-300 rounded-full px-4 py-3 mr-3 bg-secondary-100 text-sm max-h-24 text-white"
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          className={`px-4 py-3 rounded-full ${inputText.trim() === ''
            ? 'bg-secondary-200 opacity-50'
            : 'bg-secondary-100'
            }`}
          onPress={handleSendMessage}
          disabled={inputText.trim() === ''}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}