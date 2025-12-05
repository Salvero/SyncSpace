"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// Toast types
type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => string;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Icon components for different toast types
const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
        case "success":
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8L6 11L13 4" />
                </svg>
            );
        case "error":
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4L12 12M12 4L4 12" />
                </svg>
            );
        case "loading":
            return (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            );
        case "info":
        default:
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5V8M8 11V11.01" />
                </svg>
            );
    }
};

// Individual Toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const typeStyles = {
        success: "bg-[var(--color-pop-green)] text-white",
        error: "bg-[var(--color-pop-pink)] text-white",
        info: "bg-[var(--color-pop-blue)] text-white",
        loading: "bg-[var(--color-pop-yellow)] text-[var(--color-ink)]",
    };

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-3 min-w-[280px] max-w-[400px]",
                "border-2 border-[var(--color-ink)] shadow-[3px_3px_0px_0px_#000000]",
                "animate-slide-in",
                typeStyles[toast.type]
            )}
        >
            <ToastIcon type={toast.type} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            {toast.type !== "loading" && (
                <button
                    onClick={onDismiss}
                    className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 2L10 10M10 2L2 10" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// Toast Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Auto-dismiss toasts
    useEffect(() => {
        const timers = toasts
            .filter((t) => t.type !== "loading" && t.duration && t.duration > 0)
            .map((toast) =>
                setTimeout(() => dismissToast(toast.id), toast.duration)
            );

        return () => timers.forEach(clearTimeout);
    }, [toasts, dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}

            {/* Toast container - fixed at bottom right */}
            <div className="fixed bottom-20 right-6 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
