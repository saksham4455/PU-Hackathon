import React from 'react';

interface CardProps {
    title?: string;
    titleIcon?: React.ReactNode;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    onClick?: () => void;
}

/**
 * Reusable Card component for consistent layouts
 */
export function Card({
    title,
    titleIcon,
    subtitle,
    children,
    className = '',
    padding = 'md',
    shadow = 'md',
    hoverable = false,
    onClick
}: CardProps) {
    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8'
    };

    const shadowStyles = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg'
    };

    const hoverStyles = hoverable ? 'hover:shadow-xl transition-shadow cursor-pointer' : '';

    const combinedClassName = `
    bg-white rounded-xl border border-gray-200
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${hoverStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <div className={combinedClassName} onClick={onClick}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <div className="flex items-center gap-2 mb-1">
                            {titleIcon && <span className="text-gray-600">{titleIcon}</span>}
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                    )}
                    {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}
