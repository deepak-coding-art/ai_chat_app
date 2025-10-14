import { apiRequest } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Chat } from '@/lib/types';
import { router } from 'expo-router';
import { LogOut, MessageSquare, Plus, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const translateX = React.useRef(new Animated.Value(-280)).current;
    const insets = useSafeAreaInsets();
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const getUserChats = async () => {
        setIsLoadingChats(true);
        try {
            const data = await apiRequest('/chat', {
                method: 'GET',
            });
            const { chats } = data as { chats: Chat[] };
            setChats(chats as Chat[])
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
            console.error(error)
        } finally {
            setIsLoadingChats(false);
        }
    }

    React.useEffect(() => {
        if (isOpen) {
            getUserChats();
        }
    }, [isOpen]);

    React.useEffect(() => {
        Animated.timing(translateX, {
            toValue: isOpen ? 0 : -280,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isOpen, translateX]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <Pressable className="absolute inset-0 bg-black/50 z-[998]" onPress={onClose} />

            {/* Sidebar */}
            <Animated.View
                className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#1A1A1A] border-r border-[#262626] z-[999]"
                style={{
                    transform: [{ translateX }],
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-5 bg-[#2A2A2A]">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-white text-lg font-bold">AI Chat</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <X color="#FFFFFF" size={24} />
                    </TouchableOpacity>
                </View>

                {/* New chat */}
                <TouchableOpacity className="flex-row items-center px-4 py-3 gap-3" activeOpacity={0.7}>
                    <Plus color="#FFFFFF" size={24} />
                    <Text className="text-[#E5E5E5] text-sm font-semibold">New chat</Text>
                </TouchableOpacity>

                {/* Chat list */}
                {isLoadingChats ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#FFFFFF" size="large" />
                    </View>
                ) : (
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 8 }}>
                        {error && <Text className="text-[#FF0000] text-sm font-semibold px-4">{error}</Text>}
                        {chats?.map((chat) => (
                            <TouchableOpacity key={`chat-${chat.id}`} className="flex-row items-center px-4 py-3 gap-3" activeOpacity={0.7}>
                                <View className="w-7 h-7 rounded-full bg-[#333333] items-center justify-center">
                                    <MessageSquare color="#FFFFFF" size={18} />
                                </View>
                                <Text className="text-[#E5E5E5] text-sm font-semibold">{chat.title || chat.id.slice(0, 8)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Logout */}
                <TouchableOpacity
                    className="flex-row items-center gap-2 px-4 py-3 border-t border-[#262626]"
                    activeOpacity={0.7}
                    onPress={async () => {
                        await supabase.auth.signOut();
                        router.replace('/login');
                    }}
                >
                    <LogOut color="#FFFFFF" size={18} />
                    <Text className="text-white text-sm font-semibold">Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
}


