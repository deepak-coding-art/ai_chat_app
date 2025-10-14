import { Sidebar } from '@/components/sidebar';
import { Slot } from 'expo-router';
import { Menu } from 'lucide-react-native';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SideLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SafeAreaView className='flex-1 bg-[#0F0F0F]' edges={['top', 'bottom', 'left', 'right']}>
      {/* Header with menu button */}
      <View className='flex-row items-center justify-between px-4 py-3 bg-[#0F0F0F]'>
        <TouchableOpacity
          onPress={() => setIsSidebarOpen(true)}
          activeOpacity={0.7}
          className='flex-row items-center justify-center'
        >
          <Menu color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View className='flex-1 bg-[#0F0F0F]'>
        <Slot />
      </View>

      {/* Sidebar (overlay) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </SafeAreaView>
  );
}
