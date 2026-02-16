"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, AuthResponse, SignInCredentials, SignUpCredentials } from "@/lib/types";
import { api } from "@/lib/api-client";
import { API_ROUTES, ROUTES, STORAGE_KEYS } from "@/lib/constants";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signin: (credentials: SignInCredentials) => Promise<void>;
    signup: (credentials: SignUpCredentials) => Promise<void>;
    signout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state from token
    useEffect(() => {
        const initAuth = () => {
            try {
                // Only access localStorage on client side
                if (typeof window !== "undefined") {
                    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                    if (token) {
                        // In a real app, you'd validate the token with the backend
                        // For now, we'll just mark as authenticated
                        // setUser({ ... }) - would come from token decode or API call
                    }
                }
            } catch (error) {
                console.error("Failed to initialize auth:", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const signin = useCallback(
        async (credentials: SignInCredentials) => {
            try {
                const response = await api.post<AuthResponse>(
                    API_ROUTES.AUTH.SIGNIN,
                    credentials
                );

                if (response.token) {
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
                    if (response.user) {
                        setUser(response.user);
                    }
                    router.push(ROUTES.DASHBOARD);
                }
            } catch (error) {
                console.error("Sign in failed:", error);
                throw error;
            }
        },
        [router]
    );

    const signup = useCallback(
        async (credentials: SignUpCredentials) => {
            try {
                const response = await api.post<AuthResponse>(
                    API_ROUTES.AUTH.SIGNUP,
                    credentials
                );

                if (response.token) {
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
                    if (response.user) {
                        setUser(response.user);
                    }
                    router.push(ROUTES.DASHBOARD);
                }
            } catch (error) {
                console.error("Sign up failed:", error);
                throw error;
            }
        },
        [router]
    );

    const signout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        setUser(null);
        router.push(ROUTES.SIGNIN);
    }, [router]);

    const value: AuthContextType = {
        user,
        loading,
        signin,
        signup,
        signout,
        isAuthenticated: !!user || (typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

/**
 * HOC to protect routes that require authentication
 */
export function withAuth<P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> {
    return function AuthenticatedComponent(props: P) {
        const { isAuthenticated, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.push(ROUTES.SIGNIN);
            }
        }, [isAuthenticated, loading, router]);

        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
