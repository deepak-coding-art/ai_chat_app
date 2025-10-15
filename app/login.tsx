import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

WebBrowser.maybeCompleteAuthSession(); // required for web only
const redirectTo = makeRedirectUri();
const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;

    if (!access_token) return;

    const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    });
    if (error) throw error;
    return data.session;
};

export default function Auth() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Handle linking into app from email app.
    const url = Linking.useURL();
    if (url) createSessionFromUrl(url);

    const validateEmail = (email: string) => {
        return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }

    const sendMagicLink = async () => {
        if (!email) {
            setError("Please enter your email address");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: redirectTo,
                },
            });

            if (error) throw error;

            setError("");
            setShowSuccessModal(true);
            console.log({ email, redirectTo });
        } catch (error: any) {
            setError(error.message || "Failed to send magic link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView className="flex-1 items-center justify-center px-8">
            <View className="items-center justify-center mb-20">
                <Text className="text-5xl font-bold mb-2 text-white">AI Chat</Text>
                <Text className="text-gray-400 text-center">
                    Auto single step signup and login
                </Text>
            </View>

            <TextInput
                className="w-full bg-secondary-200 rounded-full px-4 py-3 text-lg text-white"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
            />
            {error && <Text className="text-red-500 text-sm self-start mx-4 mt-1">{error}</Text>}
            <View className="w-full">
                <TouchableOpacity
                    onPress={sendMagicLink}
                    disabled={loading}
                    activeOpacity={0.8}
                    className="w-full overflow-hidden rounded-full mt-6"
                >
                    <LinearGradient
                        colors={['#ec4899', '#a855f7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-2 px-6 flex-row justify-center items-center rounded-full"
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator color="white" />
                                <Text className="text-white text-lg ml-2">Sending...</Text>
                            </>
                        ) : (
                            <Text className="text-white text-lg">Login with Email</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSuccessModal}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-secondary-100 rounded-3xl p-8 mx-6 w-11/12 max-w-md shadow-xl">
                        <View className="items-center mb-6">
                            <View className="bg-green-500 rounded-full w-16 h-16 items-center justify-center mb-4">
                                <Text className="text-white text-3xl">✓</Text>
                            </View>
                            <Text className="text-2xl font-bold text-white mb-2">Email Sent!</Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-300 text-center text-base leading-6">
                                A login link has been sent to{'\n'}
                                <Text className="text-white font-semibold">{email}</Text>
                            </Text>

                            <View className="mt-4 space-y-2">
                                <Text className="text-gray-400 text-sm text-center">
                                    📧 Please check your inbox
                                </Text>
                                <Text className="text-gray-400 text-sm text-center">
                                    📂 If not found, check spam folder
                                </Text>
                                <Text className="text-gray-400 text-sm text-center">
                                    ⏰ If not there, retry after 5 min (SMTP can be sleeping now)
                                </Text>
                                <Text className="text-gray-500 text-xs text-center mt-2">

                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowSuccessModal(false)}
                            activeOpacity={0.8}
                            className="w-full overflow-hidden rounded-full"
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-3 px-6 flex-row justify-center items-center rounded-full"
                            >
                                <Text className="text-white text-lg font-semibold">Got it!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}