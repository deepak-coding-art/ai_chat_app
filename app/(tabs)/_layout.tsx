import { Sidebar } from '@/components/sidebar';
import { Slot } from 'expo-router';
import { TextAlignJustifyIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SideLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SafeAreaView className='flex-1' edges={['top', 'bottom', 'left', 'right']}>
      {/* Main content - full screen */}
      <View className='flex-1'>
        <Slot />
      </View>

      {/* Header with menu button - positioned absolutely on top */}
      <View className='absolute top-4 left-0 right-0 flex-row items-center justify-between px-4 py-3 bg-transparent z-50' style={{ pointerEvents: 'box-none' }}>
        <TouchableOpacity
          onPress={() => setIsSidebarOpen(true)}
          activeOpacity={0.7}
          className='flex-row items-center justify-center rounded-full bg-secondary-100 p-3 border border-outline-200'
          style={{ pointerEvents: 'auto' }}
        >
          <TextAlignJustifyIcon color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Sidebar (overlay) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </SafeAreaView>
  );
}
