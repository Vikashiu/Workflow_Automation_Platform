/**
 * Application-wide constants
 */

export const APP_NAME = "ZapClone";
export const APP_DESCRIPTION =
    "Automate your workflow with AI-powered automation platform";

/**
 * API Endpoints
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
export const HOOKS_URL = process.env.NEXT_PUBLIC_HOOKS_URL || "http://localhost:3002";

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: "auth_token",
    USER_PREFERENCES: "user_preferences",
    THEME: "theme",
} as const;

/**
 * API Routes
 */
export const API_ROUTES = {
    AUTH: {
        SIGNIN: `${BACKEND_URL}/api/v1/user/signin`,
        SIGNUP: `${BACKEND_URL}/api/v1/user/signup`,
    },
    ZAP: {
        CREATE: `${BACKEND_URL}/api/v1/zap/create`,
        GET_ALL: `${BACKEND_URL}/api/v1/zap/user`,
        GET_BY_ID: (id: string) => `${BACKEND_URL}/api/v1/zap/${id}`,
        UPDATE: (id: string) => `${BACKEND_URL}/api/v1/zap/${id}`,
        GET_LATEST_RUN: (id: string) => `${BACKEND_URL}/api/v1/zap/${id}/runs/latest`,
    },
    TRIGGER: {
        AVAILABLE: `${BACKEND_URL}/api/v1/trigger/available`,
    },
    ACTION: {
        AVAILABLE: `${BACKEND_URL}/api/v1/action/available`,
    },
    GOOGLE: {
        SHEETS: `${BACKEND_URL}/api/v1/google/sheets`,
        WORKSHEETS: (spreadsheetId: string) =>
            `${BACKEND_URL}/api/v1/google/sheets/${spreadsheetId}/worksheets`,
        COLUMNS: (spreadsheetId: string, worksheetName: string) =>
            `${BACKEND_URL}/api/v1/google/sheets/${spreadsheetId}/worksheets/${encodeURIComponent(
                worksheetName
            )}/columns`,
    },
    HOOKS: {
        CATCH: (userId: string, zapId: string) =>
            `${HOOKS_URL}/hooks/catch/${userId}/${zapId}`,
    },
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
    HOME: "/",
    SIGNIN: "/signin",
    SIGNUP: "/signup",
    DASHBOARD: "/dashboard",
    EDITOR: "/editor",
    ZAP: (id: string) => `/zap/${id}`,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 8,
    MAX_ZAP_NAME_LENGTH: 100,
} as const;

/**
 * UI Constants
 */
export const UI = {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    MAX_MOBILE_WIDTH: 768,
    MAX_TABLET_WIDTH: 1024,
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;
