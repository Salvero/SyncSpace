"use client";

import React, { memo, useCallback, useRef, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn, getPopColorValue } from "@/lib/utils";

interface NanoNoteData {
    content: string;
    color: "yellow" | "blue" | "pink";
    onContentChange?: (id: string, content: string) => void;
    onColorChange?: (id: string, color: "yellow" | "blue" | "pink") => void;
    onDelete?: (id: string) => void;
}

const colorClasses = {
    yellow: "bg-[var(--color-pop-yellow)]",
    blue: "bg-[var(--color-pop-blue)]",
    pink: "bg-[var(--color-pop-pink)]",
};

const NanoNote = memo(function NanoNote({ id, data, selected }: NodeProps) {
    const noteData = data as unknown as NanoNoteData;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [noteData.content]);

    const handleContentChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            noteData.onContentChange?.(id, e.target.value);
        },
        [id, noteData]
    );

    const handleColorChange = useCallback(
        (newColor: "yellow" | "blue" | "pink") => {
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
                colorClasses[noteData.color],
                selected && "ring-2 ring-[var(--color-ink)] ring-offset-2",
                "transition-shadow duration-100"
            )}
            onDoubleClick={handleDoubleClick}
        >
            {/* Header with color picker and delete */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--color-ink)]">
                {/* Color picker toggle */}
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-5 h-5 rounded-full border-2 border-[var(--color-ink)] hover:scale-110 transition-transform duration-100"
                    style={{ backgroundColor: getPopColorValue(noteData.color) }}
                    aria-label="Change note color"
                />

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    className="w-5 h-5 flex items-center justify-center text-[var(--color-ink)] hover:bg-[var(--color-ink)]/10 transition-colors duration-100"
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
                <div className="absolute top-8 left-2 z-10 flex gap-1 p-1 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]">
                    {(["yellow", "blue", "pink"] as const).map((color) => (
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
                    value={noteData.content}
                    onChange={handleContentChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Type here..."
                    className={cn(
                        "w-full min-h-[60px] resize-none bg-transparent",
                        "font-[var(--font-ui)] text-[var(--color-ink)] text-sm",
                        "placeholder:text-[var(--color-ink)]/50",
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
