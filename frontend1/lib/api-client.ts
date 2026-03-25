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

    // Response interceptor - pass errors through so AuthContext / withAuth
    // can handle 401/403 gracefully without a hard page redirect.
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
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
        // Re-throw the original error (preserving error.response.status etc.)
        // so that callers like AuthContext and withAuth can inspect the raw
        // axios error shape, e.g. e?.response?.status === 401.
        throw error;
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
