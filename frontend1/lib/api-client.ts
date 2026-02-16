import axios from "axios";
import { BACKEND_URL, STORAGE_KEYS } from "./constants";
import type { ApiError } from "./types";

/**
 * Create configured axios instance
 */
const createApiClient = () => {
    const instance = axios.create({
        baseURL: BACKEND_URL,
        timeout: 30000,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Request interceptor - Add auth token
    instance.interceptors.request.use(
        (config) => {
            // Only access localStorage in browser environment
            if (typeof window !== "undefined") {
                const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (token && config.headers) {
                    config.headers.Authorization = token;
                }
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors globally
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Check if error has response property (axios error)
            if (error?.response) {
                // Handle specific status codes
                switch (error.response.status) {
                    case 401:
                        // Unauthorized - redirect to login
                        if (typeof window !== "undefined") {
                            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                            window.location.href = "/signin";
                        }
                        break;
                    case 403:
                        console.error("Forbidden - insufficient permissions");
                        break;
                    case 404:
                        console.error("Resource not found");
                        break;
                    case 500:
                        console.error("Server error");
                        break;
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

export const apiClient = createApiClient();

/**
 * Generic API request handler with type safety
 */
export async function apiRequest<T>(
    config: Parameters<typeof apiClient.request>[0]
): Promise<T> {
    try {
        // Type assertion to satisfy TypeScript
        const response = await apiClient.request<T>(config as any);
        return response.data;
    } catch (error) {
        // Check if it's an axios error
        if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as { response?: { data?: ApiError } };
            throw new Error(
                axiosError.response?.data?.message || "An error occurred"
            );
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred");
    }
}

/**
 * Typed API methods
 */
export const api = {
    get: <T>(url: string, config?: Parameters<typeof apiClient.request>[0]) =>
        apiRequest<T>({ ...config, method: "GET", url }),

    post: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.request>[0]) =>
        apiRequest<T>({ ...config, method: "POST", url, data }),

    put: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.request>[0]) =>
        apiRequest<T>({ ...config, method: "PUT", url, data }),

    patch: <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.request>[0]) =>
        apiRequest<T>({ ...config, method: "PATCH", url, data }),

    delete: <T>(url: string, config?: Parameters<typeof apiClient.request>[0]) =>
        apiRequest<T>({ ...config, method: "DELETE", url }),
};

export default api;
