"use client";

import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

interface NoteItem {
    id: string;
    title: string;
    color: string;
}

interface NotesNavigatorProps {
    notes: NoteItem[];
    onNavigateToNote: (noteId: string) => void;
    selectedNoteId: string | null;
}

// Color classes for the dot indicator
const colorDots: Record<string, string> = {
    yellow: "bg-[var(--color-pop-yellow)]",
    blue: "bg-[var(--color-pop-blue)]",
    pink: "bg-[var(--color-pop-pink)]",
    green: "bg-[var(--color-pop-green)]",
    purple: "bg-[var(--color-pop-purple)]",
    orange: "bg-[var(--color-pop-orange)]",
};

export const NotesNavigator = memo(function NotesNavigator({
    notes,
    onNavigateToNote,
    selectedNoteId,
}: NotesNavigatorProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (notes.length === 0) return null;

    return (
        <div
            className={cn(
                "fixed top-36 right-4 z-40",
                "bg-[var(--color-canvas)] border-2 border-[var(--color-ink)]",
                "shadow-[4px_4px_0px_0px_#000000]",
                "transition-all duration-200",
                isCollapsed ? "w-10" : "w-56"
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 border-b-2 border-[var(--color-ink)] bg-[var(--color-pop-yellow)] cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {!isCollapsed && (
                    <span className="font-display text-sm font-semibold">Note Titles</span>
                )}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                        "transition-transform",
                        isCollapsed ? "rotate-180" : ""
                    )}
                >
                    <path d="M10 4L6 8L10 12" />
                </svg>
            </div>

            {/* Notes List */}
            {!isCollapsed && (
                <div className="max-h-[60vh] overflow-y-auto">
                    {notes.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => onNavigateToNote(note.id)}
                            className={cn(
                                "w-full px-3 py-2.5 text-left text-sm",
                                "border-b border-[var(--color-ink)]/20 last:border-b-0",
                                "hover:bg-[var(--color-ink)]/5 transition-colors",
                                "flex items-center gap-2",
                                selectedNoteId === note.id && "bg-[var(--color-ink)]/10 font-medium"
                            )}
                        >
                            {/* Color dot */}
                            <span
                                className={cn(
                                    "w-3 h-3 rounded-full border border-[var(--color-ink)]/30 flex-shrink-0",
                                    colorDots[note.color] || colorDots.yellow
                                )}
                            />
                            {/* Title */}
                            <span className="truncate">
                                {note.title || "Untitled"}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

NotesNavigator.displayName = "NotesNavigator";
