import { apiRequest } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Chat } from '@/lib/types';
import { router } from 'expo-router';
import { LogOut, Plus, Trash2, X } from 'lucide-react-native';
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
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [isDeletingChat, setIsDeletingChat] = React.useState<string | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [hasMoreChats, setHasMoreChats] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    const getUserChats = async (page: number = 1, append: boolean = false) => {
        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoadingChats(true);
        }

        try {
            const data = await apiRequest(`/chat?page=${page}&limit=25`, {
                method: 'GET',
            });
            const { chats: newChats, pagination } = data as {
                chats: Chat[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    hasMore: boolean;
                    totalPages: number;
                }
            };
            console.log(pagination);

            if (append) {
                setChats(prev => [...prev, ...newChats]);
            } else {
                setChats(newChats as Chat[]);
            }

            // Use the hasMore flag from the API
            setHasMoreChats(pagination.hasMore);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
            console.error(error)
        } finally {
            setIsLoadingChats(false);
            setIsLoadingMore(false);
        }
    }

    const deleteChat = async (chatId: string) => {
        setIsDeletingChat(chatId);
        try {
            await apiRequest(`/chat/messages?chat_id=${chatId}`, {
                method: 'DELETE',
            });
            // Remove the chat from the list
            setChats(prev => prev.filter(chat => chat.id !== chatId));
            setActiveDropdown(null);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete chat');
            console.error(error);
        } finally {
            setIsDeletingChat(null);
        }
    }

    const loadMoreChats = () => {
        if (!isLoadingMore && hasMoreChats && !isLoadingChats) {
            const nextPage = currentPage + 1;
            console.log('Loading page:', nextPage);
            setCurrentPage(nextPage);
            getUserChats(nextPage, true);
        }
    }

    React.useEffect(() => {
        if (isOpen) {
            // Reset pagination and load first page
            setCurrentPage(1);
            setHasMoreChats(true);
            getUserChats(1, false);
        } else {
            // Close dropdown when sidebar closes
            setActiveDropdown(null);
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
            <Pressable
                className="absolute inset-0 bg-black/50 z-[998]"
                onPress={() => {
                    if (activeDropdown) {
                        setActiveDropdown(null);
                    } else {
                        onClose();
                    }
                }}
            />

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
                <View className="flex-row items-center justify-between px-4 py-2">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-white text-lg font-bold">AI Chat</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <X color="#FFFFFF" size={24} />
                    </TouchableOpacity>
                </View>

                {/* New chat */}
                <TouchableOpacity
                    className="flex-row items-center px-4 py-3 gap-3 border-b border-outline-100"
                    activeOpacity={0.7}
                    onPress={() => {
                        router.push('/(tabs)');
                        onClose();
                    }}
                >
                    <Plus color="#FFFFFF" size={24} />
                    <Text className="text-[#E5E5E5] text-lg font-semibold">New chat</Text>
                </TouchableOpacity>

                {/* Chat list */}
                {isLoadingChats ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#FFFFFF" size="large" />
                    </View>
                ) : (
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingVertical: 8 }}
                        onScroll={(event) => {
                            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                            const paddingToBottom = 100;
                            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

                            if (isCloseToBottom) {
                                loadMoreChats();
                            }
                        }}
                        scrollEventThrottle={200}
                        onMomentumScrollEnd={(event) => {
                            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                            const paddingToBottom = 50;
                            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

                            if (isCloseToBottom) {
                                loadMoreChats();
                            }
                        }}
                    >
                        {error && <Text className="text-[#FF0000] text-sm font-semibold px-4">{error}</Text>}
                        {chats?.map((chat) => (
                            <View key={`chat-${chat.id}`} className="relative">
                                <TouchableOpacity
                                    className="flex-row items-center px-4 py-3 gap-3"
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (activeDropdown === chat.id) {
                                            setActiveDropdown(null);
                                        } else {
                                            router.push({
                                                pathname: '/(tabs)',
                                                params: { chat_id: chat.id }
                                            });
                                            onClose();
                                        }
                                    }}
                                    onLongPress={() => {
                                        setActiveDropdown(activeDropdown === chat.id ? null : chat.id);
                                    }}
                                    delayLongPress={500}
                                >
                                    {/* <View className="w-10 h-10 rounded-full bg-[#333333] items-center justify-center">
                                        <MessageSquare color="#FFFFFF" size={18} />
                                    </View> */}
                                    <Text className="text-[#E5E5E5] text-lg flex-1" numberOfLines={1}>
                                        {chat.title || chat.id.slice(0, 8)}
                                    </Text>
                                </TouchableOpacity>

                                {/* Dropdown Actions */}
                                {activeDropdown === chat.id && (
                                    <View className="absolute right-2 top-12 bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-lg z-50 min-w-[120px]">
                                        <TouchableOpacity
                                            className="flex-row items-center gap-2 px-3 py-2.5 rounded-lg"
                                            activeOpacity={0.7}
                                            onPress={() => deleteChat(chat.id)}
                                            disabled={isDeletingChat === chat.id}
                                        >
                                            {isDeletingChat === chat.id ? (
                                                <ActivityIndicator size="small" color="#FF4444" />
                                            ) : (
                                                <Trash2 color="#FF4444" size={16} />
                                            )}
                                            <Text className="text-[#FF4444] text-sm font-semibold">
                                                Delete
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <View className="py-4 items-center">
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                        )}

                        {/* End of List Indicator */}
                        {!hasMoreChats && chats.length > 0 && (
                            <View className="py-4 items-center">
                                <Text className="text-[#666666] text-xs">No more chats</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* Logout */}
                <TouchableOpacity
                    className="flex-row items-center gap-2 px-4 py-3 border-t border-outline-100"
                    activeOpacity={0.7}
                    onPress={async () => {
                        await supabase.auth.signOut();
                        router.replace('/login');
                    }}
                >
                    <LogOut color="#FFFFFF" size={18} />
                    <Text className="text-white text-lg font-semibold">Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
}


