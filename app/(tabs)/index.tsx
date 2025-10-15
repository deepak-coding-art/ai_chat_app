import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getChatMessages, streamChat } from '@/lib/api';
import { Message } from '@/lib/types';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';


interface Tool {
  name: string;
  icon: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ chat_id?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(params.chat_id || null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  // Load messages when chat_id changes
  useEffect(() => {
    const loadMessages = async () => {
      if (params.chat_id) {
        setIsLoadingMessages(true);
        try {
          const data = await getChatMessages(params.chat_id);
          setMessages(data.messages);
          setChatId(params.chat_id);
        } catch (error) {
          console.error("Failed to load messages:", error);
        } finally {
          setIsLoadingMessages(false);
        }
      } else {
        // New chat - clear messages
        setMessages([]);
        setChatId(null);
      }
    };

    loadMessages();
  }, [params.chat_id]);

  const handleSendMessage = async () => {
    const trimmedInputText = inputText.trim();
    if (trimmedInputText === '') return;
    const newMessageID = Date.now().toString();

    const newMessage: Message = {
      role: "user",
      content: trimmedInputText,
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
                setActiveTool(null);
                // Append token to the latest assistant draft
                return prev.map(m =>
                  m.id === draftAssistantId ? { ...m, content: m.content + token } : m
                );
              });
            } else if (event.type === "final") {
              // Ensure final message is set (in case no tokens streamed)
              setActiveTool(null);
              const finalText = extractText(event.message);
              setMessages(prev => prev.map(m =>
                m.id === draftAssistantId && finalText
                  ? { ...m, content: finalText }
                  : m
              ));
              // Update chat id
              if (event.chat_id) setChatId(event.chat_id);
            } else if (event.type === "tool_start") {
              const tool_name = event.tool;
              const tool_icon = event.tool_icon;
              const tool: Tool = {
                name: tool_name,
                icon: tool_icon,
              };
              setActiveTool(tool);
            } else if (event.type === "tool_end") {
              setActiveTool((old) => old?.name === event.tool ? null : old);
            }
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

        <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
          {isLoadingMessages ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#999" />
            </View>
          ) : (
            <>
              <View className="h-10" />
              {messages.map((message) => (
                <MessageBox key={message.id} message={message} activeTool={activeTool} />
              ))}
            </>
          )}
        </ScrollView>

        {/* Input */}
        <ChatInput inputText={inputText} setInputText={setInputText} handleSendMessage={handleSendMessage} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}


const MessageBox = ({ message, activeTool }: { message: Message; activeTool: Tool | null }) => {
  const isUser = message.role === "user";
  const isLoading = !isUser && !message.content;

  return (
    <View
      className={`flex-row items-end mb-4 mx-2 ${isUser ? 'justify-end' : 'justify-start'
        }`}
    >

      <View
        className={`max-w-[80%] p-3 rounded-[24px] ${isUser
          ? 'bg-secondary-200' // rounded-br-sm
          : 'bg-secondary-50' //rounded-bl-sm'
          }`}
      >
        {isLoading ? (
          <View className="flex-row items-center gap-2 min-h-[24px]">
            <BouncingDots />
            {activeTool && (
              <ThemedText className="text-xs text-typography-600 ml-2">
                {activeTool.icon}
              </ThemedText>
            )}
          </View>
        ) : (
          <ThemedText
            className={`text-sm ${isUser ? 'text-white' : 'text-typography-900'
              }`}
          >
            {message.content}
          </ThemedText>
        )}

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

const BouncingDots = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Bounce animation: up and down
    const bounceAnimation = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1, // infinite
      false
    );

    // Start each dot with a delay
    dot1.value = bounceAnimation;
    dot2.value = withDelay(150, bounceAnimation);
    dot3.value = withDelay(300, bounceAnimation);
  }, [dot1, dot2, dot3]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View className="flex-row items-center gap-1">
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#666',
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#666',
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#666',
          },
          animatedStyle3,
        ]}
      />
    </View>
  );
};

const ChatInput = ({ inputText, setInputText, handleSendMessage }: { inputText: string, setInputText: (text: string) => void, handleSendMessage: () => void }) => {
  return (
    <View className="p-4 border-t border-outline-50">
      <View className="flex-row items-end">
        <TextInput
          className="flex-1 rounded-[24px] px-4 py-3 mr-3 bg-secondary-100 text-lg max-h-24 text-white"
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          maxLength={1000}
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
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}