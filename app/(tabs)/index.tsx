import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I received your message: "${inputText}". This is a simulated AI response.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView className="flex-1">
        {/* Messages */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {messages.map((message) => (
              <View
                key={message.id}
                className={`flex-row items-end mb-4 ${message.isUser ? 'justify-end' : 'justify-start'
                  }`}
              >
                {!message.isUser && (
                  <View className="w-8 h-8 rounded-full bg-secondary-200 justify-center items-center mx-2">
                    <Text className="text-xs font-bold text-typography-600">AI</Text>
                  </View>
                )}

                <View
                  className={`max-w-[80%] p-3 rounded-lg ${message.isUser
                    ? 'bg-primary-500 rounded-br-sm'
                    : 'bg-secondary-200 rounded-bl-sm'
                    }`}
                >
                  <ThemedText
                    className={`text-sm ${message.isUser ? 'text-white' : 'text-typography-900'
                      }`}
                  >
                    {message.text}
                  </ThemedText>
                  <ThemedText
                    className={`text-2xs mt-1 ${message.isUser ? 'text-white/70' : 'text-typography-500'
                      }`}
                  >
                    {formatTime(message.timestamp)}
                  </ThemedText>
                </View>

                {message.isUser && (
                  <View className="w-8 h-8 rounded-full bg-primary-300 justify-center items-center mx-2">
                    <Text className="text-xs font-bold text-white">U</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Input */}
        <View className="bg-background-50 p-4 border-t border-outline-200">
          <View className="flex-row items-end">
            <TextInput
              className="flex-1 border border-outline-300 rounded-full px-4 py-3 mr-3 bg-white text-sm max-h-24"
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              className={`px-5 py-3 rounded-full ${inputText.trim() === ''
                ? 'bg-secondary-300 opacity-50'
                : 'bg-primary-500'
                }`}
              onPress={handleSendMessage}
              disabled={inputText.trim() === ''}
            >
              <ThemedText className="text-white text-sm font-semibold">
                Send
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
