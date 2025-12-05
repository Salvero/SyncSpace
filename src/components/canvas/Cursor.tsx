"use client";

import React, { memo } from "react";
import { getPopColorValue } from "@/lib/utils";
import type { PopColor } from "@/lib/types";

interface CursorProps {
    x: number;
    y: number;
    name: string;
    color: PopColor;
}

export const Cursor = memo(function Cursor({ x, y, name, color }: CursorProps) {
    const colorValue = getPopColorValue(color);

    return (
        <div
            className="absolute pointer-events-none z-50 transition-transform duration-75"
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
        >
            {/* Cursor arrow */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={colorValue}
                stroke="#111111"
                strokeWidth="1.5"
                className="drop-shadow-sm"
            >
                <path d="M5.5 3.21V20.8L9.96 14.62L17.83 14.46L5.5 3.21Z" />
            </svg>

            {/* Name label */}
            <div
                className="absolute left-4 top-4 px-2 py-0.5 text-xs font-medium whitespace-nowrap border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]"
                style={{
                    backgroundColor: colorValue,
                    color: ["blue", "pink", "purple"].includes(color) ? "white" : "#111111",
                }}
            >
                {name}
            </div>
        </div>
    );
});

Cursor.displayName = "Cursor";

// Cursors overlay component for multiple cursors
interface CursorsOverlayProps {
    cursors: Array<{
        id: string;
        x: number;
        y: number;
        name: string;
        color: PopColor;
    }>;
}

export const CursorsOverlay = memo(function CursorsOverlay({
    cursors,
}: CursorsOverlayProps) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {cursors.map((cursor) => (
                <Cursor
                    key={cursor.id}
                    x={cursor.x}
                    y={cursor.y}
                    name={cursor.name}
                    color={cursor.color}
                />
            ))}
        </div>
    );
});

CursorsOverlay.displayName = "CursorsOverlay";

// Presence indicator showing current user and others count
interface PresenceIndicatorProps {
    myName: string;
    myColor: PopColor;
    othersCount: number;
}

export const PresenceIndicator = memo(function PresenceIndicator({
    myName,
    myColor,
    othersCount,
}: PresenceIndicatorProps) {
    const colorValue = getPopColorValue(myColor);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
            {/* Current user badge */}
            <div
                className="flex items-center gap-2 px-3 py-1.5 border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]"
                style={{
                    backgroundColor: colorValue,
                    color: ["blue", "pink", "purple"].includes(myColor) ? "white" : "#111111",
                }}
            >
                <span className="text-sm font-medium">You: {myName}</span>
            </div>

            {/* Others count */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-[var(--color-ink)]">
                    {othersCount === 0
                        ? "Only you"
                        : `${othersCount} other${othersCount > 1 ? "s" : ""} online`}
                </span>
            </div>
        </div>
    );
});

PresenceIndicator.displayName = "PresenceIndicator";
