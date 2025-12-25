import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose: () => void;
}

/**
 * Individual Toast Component
 */
export function Toast({ type, message, onClose }: ToastProps) {
    const styles = {
        success: {
            bg: 'bg-green-50 border-green-500',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            text: 'text-green-800'
        },
        error: {
            bg: 'bg-red-50 border-red-500',
            icon: <XCircle className="w-5 h-5 text-red-500" />,
            text: 'text-red-800'
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-500',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
            text: 'text-yellow-800'
        },
        info: {
            bg: 'bg-blue-50 border-blue-500',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            text: 'text-blue-800'
        }
    };

    const style = styles[type];

    return (
        <div
            className={`${style.bg} border-l-4 rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3 animate-slideIn max-w-md`}
            role="alert"
        >
            <div className="flex-shrink-0">{style.icon}</div>
            <p className={`${style.text} flex-1 font-medium text-sm`}>{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
