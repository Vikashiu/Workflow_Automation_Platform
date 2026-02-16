/**
 * Core Type Definitions for ZapClone
 */

// ========================================
// User Types
// ========================================

export interface User {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user?: User;
}

export interface SignInCredentials {
    username: string;
    password: string;
}

export interface SignUpCredentials {
    name: string;
    username: string;
    password: string;
}

// ========================================
// Zap Types
// ========================================

export interface Trigger {
    id: string;
    name: string;
    image: string;
    metadata?: Record<string, unknown>;
}

export interface Action {
    id: string;
    name: string;
    image: string;
    metadata?: Record<string, unknown>;
}

export interface TriggerResponse {
    availableTriggers: Trigger[];
}

export interface ActionResponse {
    availableActions: Action[];
}

export interface ZapAction {
    id: string;
    zapId: string;
    actionId: string;
    sortingOrder: number;
    metadata: Record<string, unknown>;
    type: {
        id: string;
        name: string;
        image: string;
    };
}

export interface ZapTrigger {
    id: string;
    zapId: string;
    TriggerId: string;
    metadata: Record<string, unknown>;
    type: {
        id: string;
        name: string;
        image: string;
    };
}

export interface Zap {
    id: string;
    name?: string;
    TriggerId: string;
    userId: number;
    createdAt: string;
    actions: ZapAction[];
    trigger: ZapTrigger;
}

export interface GetAllZapResponse {
    zaps: Zap[];
}

export interface CreateZapPayload {
    availableTriggerId: string;
    actions: {
        availableActionId: string;
        sortingOrder: number;
        actionMetadata: Record<string, unknown>;
    }[];
}

// ========================================
// Google Integration Types
// ========================================

export interface GoogleSheet {
    id: string;
    name: string;
}

export interface GoogleSheetsResponse {
    sheets: GoogleSheet[];
}

export interface GoogleWorksheetsResponse {
    worksheets: string[];
}

export interface GoogleColumnsResponse {
    columns: string[];
}

export interface GoogleSheetMetadata {
    spreadsheetId: string;
    sheetName: string;
    values: string[];
}

export interface GoogleCalendarMetadata {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
}

// ========================================
// Email Types
// ========================================

export interface EmailMetadata {
    email: string;
    body: string;
}

// ========================================
// Solana Types
// ========================================

export interface SolanaMetadata {
    amount: string;
    address: string;
}

// ========================================
// React Flow / Canvas Types
// ========================================

export interface NodeData {
    label: string;
    metadata?: Record<string, unknown>;
}

export interface CanvasNode {
    id: string;
    type?: string;
    data: NodeData;
    position: { x: number; y: number };
    deletable?: boolean;
    connectable?: boolean;
    nodeOrigin?: [number, number];
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
}

// ========================================
// API Types
// ========================================

export interface ApiError {
    message: string;
    code?: string;
    details?: unknown;
}

export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
    success: boolean;
}

// ========================================
// UI Component Types
// ========================================

export interface DropdownOption {
    label: string;
    value: string;
}

export interface LoadingState {
    spreadsheets: boolean;
    worksheets: boolean;
    columns: boolean;
}

export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    duration?: number;
}

export interface FormField {
    name: string;
    type: "text" | "email" | "password" | "number" | "datetime-local" | "textarea";
    label: string;
    placeholder?: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

// ========================================
// Utility Types
// ========================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type AsyncState<T> = {
    data: Nullable<T>;
    loading: boolean;
    error: Nullable<Error>;
};

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
