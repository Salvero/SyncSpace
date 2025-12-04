"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ToolbarProps {
    onAddNote: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onMagic?: () => void;
    onExport?: () => void;
    canUndo: boolean;
    canRedo: boolean;
    selectedNodeId: string | null;
    isGenerating?: boolean;
}

// Icon components
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3V13M3 8H13" />
    </svg>
);

const UndoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6H10C12.2091 6 14 7.79086 14 10C14 12.2091 12.2091 14 10 14H8" />
        <path d="M6 3L3 6L6 9" />
    </svg>
);

const RedoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 6H6C3.79086 6 2 7.79086 2 10C2 12.2091 3.79086 14 6 14H8" />
        <path d="M10 3L13 6L10 9" />
    </svg>
);

const MagicIcon = ({ spinning = false }: { spinning?: boolean }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={spinning ? "animate-spin" : ""}
    >
        <path d="M8 2L9.09 5.26L12.5 5.27L9.73 7.27L10.82 10.53L8 8.53L5.18 10.53L6.27 7.27L3.5 5.27L6.91 5.26L8 2Z" />
    </svg>
);

const ExportIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 10V14H2V10" />
        <path d="M8 2V10" />
        <path d="M5 7L8 10L11 7" />
    </svg>
);

export const Toolbar = memo(function Toolbar({
    onAddNote,
    onUndo,
    onRedo,
    onMagic,
    onExport,
    canUndo,
    canRedo,
    selectedNodeId,
    isGenerating = false,
}: ToolbarProps) {
    return (
        <div
            className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
                "flex items-center gap-2 px-4 py-3",
                "bg-[var(--color-canvas)] border-2 border-[var(--color-ink)]",
                "shadow-[4px_4px_0px_0px_#000000]"
            )}
            role="toolbar"
            aria-label="Canvas toolbar"
        >
            {/* Add Note */}
            <Button
                onClick={onAddNote}
                variant="yellow"
                size="sm"
                aria-label="Add new note (N)"
                title="Add Note (N)"
            >
                <PlusIcon />
                <span className="hidden sm:inline">Note</span>
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--color-ink)]/30" />

            {/* Undo */}
            <Button
                onClick={onUndo}
                variant="ghost"
                size="sm"
                disabled={!canUndo}
                aria-label="Undo (Ctrl+Z)"
                title="Undo (Ctrl+Z)"
            >
                <UndoIcon />
            </Button>

            {/* Redo */}
            <Button
                onClick={onRedo}
                variant="ghost"
                size="sm"
                disabled={!canRedo}
                aria-label="Redo (Ctrl+Shift+Z)"
                title="Redo (Ctrl+Shift+Z)"
            >
                <RedoIcon />
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--color-ink)]/30" />

            {/* Magic (AI) - only shown when a node is selected */}
            <Button
                onClick={onMagic}
                variant="pink"
                size="sm"
                disabled={!selectedNodeId || isGenerating}
                aria-label="AI Magic - Generate related ideas"
                title="Magic (M)"
                className={cn(
                    isGenerating && "cursor-wait animate-pulse"
                )}
            >
                <MagicIcon spinning={isGenerating} />
                <span className="hidden sm:inline">{isGenerating ? "Thinking..." : "Magic"}</span>
            </Button>

            {/* Export */}
            <Button
                onClick={onExport}
                variant="default"
                size="sm"
                aria-label="Export canvas"
                title="Export"
            >
                <ExportIcon />
            </Button>

            {/* Keyboard shortcuts hint */}
            <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-[var(--color-ink)]/30">
                <span className="text-xs text-[var(--color-ink)]/50 font-mono">
                    N: Note • M: Magic • ⌘Z: Undo
                </span>
            </div>
        </div>
    );
});

Toolbar.displayName = "Toolbar";
