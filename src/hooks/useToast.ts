import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

/**
 * Custom hook for toast notifications
 * Provides simple toast notification management
 */
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, message };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return id;
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        return showToast('success', message, duration);
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        return showToast('error', message, duration);
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        return showToast('info', message, duration);
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        return showToast('warning', message, duration);
    }, [showToast]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
        clearAll
    };
}
