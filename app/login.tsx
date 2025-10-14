import Auth from '@/components/Auth';
import { ThemedView } from '@/components/themed-view';
import React from 'react';

export default function LoginScreen() {
    return (
        <ThemedView className="flex-1 items-center justify-center px-6">
            <Auth />
        </ThemedView>
    );
}


