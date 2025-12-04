"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "yellow" | "blue" | "pink" | "ghost";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export const Button = React.memo(function Button({
    variant = "default",
    size = "md",
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium font-[var(--font-ui)]
    border-2 border-[var(--color-ink)]
    transition-transform duration-100 ease-out
    cursor-pointer select-none
    focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--color-ink)] focus-visible:outline-offset-2
  `;

    const variantStyles = {
        default: `
      bg-[var(--color-canvas)] text-[var(--color-ink)]
      shadow-[4px_4px_0px_0px_#000000]
      hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]
      active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000]
    `,
        yellow: `
      bg-[var(--color-pop-yellow)] text-[var(--color-ink)]
      shadow-[4px_4px_0px_0px_#000000]
      hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]
      active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000]
    `,
        blue: `
      bg-[var(--color-pop-blue)] text-white
      shadow-[4px_4px_0px_0px_#000000]
      hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]
      active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000]
    `,
        pink: `
      bg-[var(--color-pop-pink)] text-white
      shadow-[4px_4px_0px_0px_#000000]
      hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]
      active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000]
    `,
        ghost: `
      bg-transparent text-[var(--color-ink)]
      border-transparent
      hover:bg-[var(--color-ink)]/5
      active:bg-[var(--color-ink)]/10
    `,
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    const disabledStyles = disabled
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : "";

    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                disabledStyles,
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";
