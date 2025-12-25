import React from 'react';

interface BadgeProps {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

/**
 * Reusable Badge component for labels and statuses
 */
export function Badge({
    variant = 'default',
    size = 'md',
    children,
    className = '',
    icon
}: BadgeProps) {
    const variantStyles = {
        default: 'bg-gray-200 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-cyan-100 text-cyan-800'
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-3 py-1 text-sm gap-1.5',
        lg: 'px-4 py-1.5 text-base gap-2'
    };

    const combinedClassName = `
    inline-flex items-center font-medium rounded-full
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <span className={combinedClassName}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
}
