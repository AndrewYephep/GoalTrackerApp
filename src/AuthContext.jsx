import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from './utils/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const setupAuth = async () => {
            try {
                // Get initial session
                const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                if (sessionError) throw sessionError;
                
                if (mounted) {
                    console.log('Setting initial user:', session?.user); // Debug log
                    setUser(session?.user ?? null);
                }

                // Set up real-time subscription
                const { data: { subscription }} = supabaseClient.auth.onAuthStateChange((_event, session) => {
                    if (mounted) {
                        console.log('Auth state changed, new user:', session?.user); // Debug log
                        setUser(session?.user ?? null);
                    }
                });

                return () => {
                    mounted = false;
                    subscription?.unsubscribe();
                };
            } catch (error) {
                console.error('Auth setup error:', error);
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        setupAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};