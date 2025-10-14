// This route handles returning from OAuth providers via expo-router deep links
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function AuthIntent() {
  const router = useRouter();
  useEffect(() => {
    // After Supabase processes the session from the redirect, just bounce to index
    router.replace("/");
  }, [router]);
  return null;
}
