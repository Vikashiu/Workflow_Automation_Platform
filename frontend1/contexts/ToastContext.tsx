"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: Toast["type"], duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: Toast["type"], duration: number = 3000) => {
            const id = generateId();
            const toast: Toast = { id, message, type, duration };

            setToasts((prev) => [...prev, toast]);

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }
        },
        [removeToast]
    );

    const success = useCallback(
        (message: string, duration?: number) => addToast(message, "success", duration),
        [addToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => addToast(message, "error", duration),
        [addToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => addToast(message, "info", duration),
        [addToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) => addToast(message, "warning", duration),
        [addToast]
    );

    return (
        <ToastContext.Provider
            value={{ toasts, addToast, removeToast, success, error, info, warning }}
        >
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

function ToastContainer({
    toasts,
    onRemove,
}: {
    toasts: Toast[];
    onRemove: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({
    toast,
    onRemove,
}: {
    toast: Toast;
    onRemove: (id: string) => void;
}) {
    const bgColors = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
        warning: "bg-yellow-500",
    };

    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };

    return (
        <div
            className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] animate-slide-in`}
            role="alert"
        >
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{icons[toast.type]}</span>
                <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    );
}
