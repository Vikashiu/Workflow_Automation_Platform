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
        const initAuth = async () => {
            try {
                // Only access localStorage on client side
                if (typeof window !== "undefined") {
                    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                    if (token) {
                        try {
                            const res = await api.get<{ user: User }>(API_ROUTES.USER.ME);
                            if (res && res.user) {
                                setUser(res.user);
                            } else {
                                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                            }
                        } catch (e) {
                            console.error("Token validation failed:", e);
                            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                        }
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
                    router.replace(ROUTES.DASHBOARD);
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
        isAuthenticated: !!user,
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
            // Only redirect if we've finished checking token validity and definitely aren't authenticated
            if (!loading && !isAuthenticated) {
                router.push(ROUTES.SIGNIN);
            }
        }, [isAuthenticated, loading, router]);

        // Show loading spinner while AuthContext runs its initial check against /api/v1/user
        if (loading) {
            return (
                <div className="flex flex-col gap-4 items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 dark:border-slate-800 dark:border-t-slate-200 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading workspace...</p>
                </div>
            );
        }

        // Failsafe to prevent flashing the protected component before redirect takes over
        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
