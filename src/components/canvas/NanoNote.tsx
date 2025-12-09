"use client";

import React, { memo, useCallback, useRef, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn, getPopColorValue } from "@/lib/utils";
import { useSyncedNoteContent } from "@/hooks/useYjs";

interface NanoNoteData {
    content: string;
    color: "yellow" | "blue" | "pink" | "green" | "purple" | "orange";
    onContentChange?: (id: string, content: string) => void;
    onColorChange?: (id: string, color: "yellow" | "blue" | "pink" | "green" | "purple" | "orange") => void;
    onDelete?: (id: string) => void;
}

const colorClasses: Record<string, string> = {
    yellow: "bg-[var(--color-pop-yellow)]",
    blue: "bg-[var(--color-pop-blue)]",
    pink: "bg-[var(--color-pop-pink)]",
    green: "bg-[var(--color-pop-green)]",
    purple: "bg-[var(--color-pop-purple)]",
    orange: "bg-[var(--color-pop-orange)]",
};

// Colors that need white text for better readability
const darkColors = new Set(["blue", "pink", "green", "purple"]);

const getTextColorClass = (color: string) => {
    return darkColors.has(color) ? "text-white" : "text-[var(--color-ink)]";
};

const NanoNote = memo(function NanoNote({ id, data, selected }: NodeProps) {
    const noteData = data as unknown as NanoNoteData;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Use Y.js synced content for real-time collaboration
    const { content: syncedContent, handleChange: handleSyncedChange } = useSyncedNoteContent(id);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [syncedContent]);

    const handleContentChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            // Use the synced change handler for real-time updates
            handleSyncedChange(e);
        },
        [handleSyncedChange]
    );

    const handleColorChange = useCallback(
        (newColor: "yellow" | "blue" | "pink" | "green" | "purple" | "orange") => {
            noteData.onColorChange?.(id, newColor);
            setShowColorPicker(false);
        },
        [id, noteData]
    );

    const handleDelete = useCallback(() => {
        noteData.onDelete?.(id);
    }, [id, noteData]);

    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }, []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
    }, []);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsEditing(false);
                textareaRef.current?.blur();
            }
            // Check for /ai command
            if (noteData.content.includes("/ai")) {
                // Trigger AI generation (will be handled by parent)
            }
        },
        [noteData.content]
    );

    return (
        <div
            className={cn(
                "relative min-w-[180px] max-w-[320px]",
                "border-2 border-[var(--color-ink)]",
                "shadow-[4px_4px_0px_0px_#000000]",
                "rounded-sm",
                colorClasses[noteData.color],
                selected && "ring-2 ring-[var(--color-ink)] ring-offset-2"
            )}
            onDoubleClick={handleDoubleClick}
        >
            {/* Header with color picker and delete */}
            <div className={cn(
                "flex items-center justify-between px-2 py-1 border-b",
                darkColors.has(noteData.color) ? "border-white/30" : "border-[var(--color-ink)]"
            )}>
                {/* Color picker toggle - palette icon */}
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={cn(
                        "flex items-center gap-1.5 px-1.5 py-1 rounded-sm transition-colors duration-100",
                        darkColors.has(noteData.color)
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)]"
                    )}
                    aria-label="Change note color"
                    title="Change color"
                >
                    {/* Paint palette icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
                        <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
                        <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
                        <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
                    </svg>
                    {/* Dropdown chevron */}
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60">
                        <path d="M3 5L6 8L9 5" />
                    </svg>
                </button>

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    className={cn(
                        "w-5 h-5 flex items-center justify-center transition-colors duration-100",
                        darkColors.has(noteData.color)
                            ? "text-white hover:bg-white/20"
                            : "text-[var(--color-ink)] hover:bg-[var(--color-ink)]/10"
                    )}
                    aria-label="Delete note"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M2 2L10 10M10 2L2 10" />
                    </svg>
                </button>
            </div>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <div className="absolute top-8 left-2 z-10 flex flex-wrap gap-1 p-1 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000] max-w-[96px]">
                    {(["yellow", "blue", "pink", "green", "purple", "orange"] as const).map((color) => (
                        <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                                "w-6 h-6 border-2 border-[var(--color-ink)]",
                                "hover:scale-110 transition-transform duration-100",
                                noteData.color === color && "ring-2 ring-[var(--color-ink)]"
                            )}
                            style={{ backgroundColor: getPopColorValue(color) }}
                            aria-label={`Set color to ${color}`}
                        />
                    ))}
                </div>
            )}

            {/* Content textarea */}
            <div className="p-3">
                <textarea
                    ref={textareaRef}
                    value={syncedContent}
                    onChange={handleContentChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Type here..."
                    className={cn(
                        "w-full min-h-[60px] resize-none bg-transparent",
                        "font-[var(--font-ui)] text-sm leading-relaxed",
                        getTextColorClass(noteData.color),
                        darkColors.has(noteData.color)
                            ? "placeholder:text-white/60"
                            : "placeholder:text-[var(--color-ink)]/50",
                        "focus:outline-none",
                        "cursor-text"
                    )}
                    aria-label="Note content"
                />
            </div>

            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-[var(--color-ink)] !border-2 !border-[var(--color-canvas)]"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-[var(--color-ink)] !border-2 !border-[var(--color-canvas)]"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-[var(--color-ink)] !border-2 !border-[var(--color-canvas)]"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!bg-[var(--color-ink)] !border-2 !border-[var(--color-canvas)]"
            />
        </div>
    );
});

NanoNote.displayName = "NanoNote";

export default NanoNote;
