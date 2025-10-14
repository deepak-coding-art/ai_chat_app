import { supabase } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import React from 'react';

export default function Entry() {
    const [initializing, setInitializing] = React.useState(true);
    const [isSignedIn, setIsSignedIn] = React.useState(false);

    React.useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            setIsSignedIn(!!data.session);
            setInitializing(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setIsSignedIn(!!session);
        });
        return () => {
            isMounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    if (initializing) return null;
    return isSignedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}




