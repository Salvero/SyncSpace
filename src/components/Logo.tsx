"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 48, text: "text-2xl" },
    lg: { icon: 72, text: "text-4xl" },
    xl: { icon: 96, text: "text-6xl" },
};

export const Logo = memo(function Logo({
    size = "md",
    showText = true,
    className,
}: LogoProps) {
    const { icon, text } = sizeMap[size];

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {/* Logo Icon - Connected nodes forming an abstract "S" shape */}
            <svg
                width={icon}
                height={icon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* Background square with hard shadow effect */}
                <rect
                    x="4"
                    y="4"
                    width="56"
                    height="56"
                    fill="#FFE600"
                    stroke="#111111"
                    strokeWidth="3"
                />
                {/* Shadow */}
                <rect
                    x="8"
                    y="8"
                    width="56"
                    height="56"
                    fill="#111111"
                    style={{ zIndex: -1 }}
                />

                {/* Connection lines (drawn first so nodes appear on top) */}
                <path
                    d="M20 20 L44 20"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M44 20 L44 32"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M44 32 L20 32"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M20 32 L20 44"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M20 44 L44 44"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* Nodes - Yellow */}
                <circle cx="20" cy="20" r="6" fill="#FFE600" stroke="#111111" strokeWidth="2.5" />

                {/* Nodes - Blue */}
                <circle cx="44" cy="20" r="6" fill="#3B82F6" stroke="#111111" strokeWidth="2.5" />
                <circle cx="20" cy="44" r="6" fill="#3B82F6" stroke="#111111" strokeWidth="2.5" />

                {/* Nodes - Pink */}
                <circle cx="44" cy="32" r="6" fill="#EC4899" stroke="#111111" strokeWidth="2.5" />
                <circle cx="20" cy="32" r="6" fill="#EC4899" stroke="#111111" strokeWidth="2.5" />

                {/* Nodes - Yellow */}
                <circle cx="44" cy="44" r="6" fill="#FFE600" stroke="#111111" strokeWidth="2.5" />
            </svg>

            {/* Logo Text */}
            {showText && (
                <span className={cn("font-display tracking-tight", text)}>
                    SYNC<span className="text-[var(--color-pop-pink)]">SPACE</span>
                </span>
            )}
        </div>
    );
});

Logo.displayName = "Logo";

// Favicon-optimized version (simpler for small sizes)
export const LogoIcon = memo(function LogoIcon({
    size = 32,
    className,
}: {
    size?: number;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background */}
            <rect width="64" height="64" fill="#FFE600" />

            {/* Connection lines */}
            <path
                d="M16 16 L48 16 L48 32 L16 32 L16 48 L48 48"
                stroke="#111111"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Nodes */}
            <circle cx="16" cy="16" r="7" fill="#3B82F6" stroke="#111111" strokeWidth="2" />
            <circle cx="48" cy="16" r="7" fill="#EC4899" stroke="#111111" strokeWidth="2" />
            <circle cx="48" cy="32" r="7" fill="#FFE600" stroke="#111111" strokeWidth="2" />
            <circle cx="16" cy="32" r="7" fill="#EC4899" stroke="#111111" strokeWidth="2" />
            <circle cx="16" cy="48" r="7" fill="#FFE600" stroke="#111111" strokeWidth="2" />
            <circle cx="48" cy="48" r="7" fill="#3B82F6" stroke="#111111" strokeWidth="2" />
        </svg>
    );
});

LogoIcon.displayName = "LogoIcon";
