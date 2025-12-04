"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge as addReactFlowEdge,
    Connection,
    Edge,
    NodeChange,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NanoNote from "./NanoNote";
import { Toolbar } from "./Toolbar";
import { useSyncedCanvas } from "@/hooks/useSyncedCanvas";
import type { NanoNoteNode, PopColor } from "@/lib/types";

// Register custom node types
const nodeTypes = {
    nanoNote: NanoNote,
};

export default function SyncedBoard() {
    const {
        notes,
        edges: syncedEdges,
        isLoading,
        isSynced,
        addNote,
        updateNoteContent,
        updateNoteColor,
        updateNotePosition,
        deleteNote,
        addEdge,
    } = useSyncedCanvas();

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // Convert synced edges to React Flow format
    const flowEdges: Edge[] = useMemo(() => {
        return syncedEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            style: { stroke: "#111111", strokeWidth: 2 },
        }));
    }, [syncedEdges]);

    // Convert synced notes to React Flow nodes with handlers
    const flowNodes = useMemo(() => {
        return notes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                onContentChange: updateNoteContent,
                onColorChange: updateNoteColor,
                onDelete: deleteNote,
            },
        }));
    }, [notes, updateNoteContent, updateNoteColor, deleteNote]);

    // Handle node changes (position, selection)
    const onNodesChange = useCallback(
        (changes: NodeChange<NanoNoteNode>[]) => {
            changes.forEach((change) => {
                if (change.type === "position" && change.position && !change.dragging) {
                    // Only update when drag ends
                    updateNotePosition(change.id, change.position.x, change.position.y);
                }
                if (change.type === "select") {
                    if (change.selected) {
                        setSelectedNodeId(change.id);
                    } else if (selectedNodeId === change.id) {
                        setSelectedNodeId(null);
                    }
                }
            });
        },
        [updateNotePosition, selectedNodeId]
    );

    // Handle edge connections
    const onConnect = useCallback(
        (connection: Connection) => {
            if (connection.source && connection.target) {
                addEdge(connection.source, connection.target);
            }
        },
        [addEdge]
    );

    // Add note at random position
    const handleAddNote = useCallback(() => {
        const x = 200 + Math.random() * 300;
        const y = 200 + Math.random() * 200;
        addNote(x, y);
    }, [addNote]);

    // Magic (AI) functionality
    const handleMagic = useCallback(async () => {
        if (!selectedNodeId || isGenerating) return;

        const selectedNode = notes.find((n) => n.id === selectedNodeId);
        if (!selectedNode) return;

        const noteContent = selectedNode.data.content;
        if (!noteContent.trim()) {
            alert("Please add some content to the note first!");
            return;
        }

        setIsGenerating(true);

        try {
            const contextNotes = notes
                .filter((n) => n.id !== selectedNodeId && n.data.content.trim())
                .slice(0, 3)
                .map((n) => n.data.content);

            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteContent, contextNotes }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate ideas");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            let fullText = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
            }

            let ideas: string[];
            try {
                const jsonMatch = fullText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    ideas = JSON.parse(jsonMatch[0]);
                } else {
                    ideas = fullText.split("\n").filter((line) => line.trim()).slice(0, 3);
                }
            } catch {
                ideas = ["Related idea 1", "Related idea 2", "Related idea 3"];
            }

            const colors: PopColor[] = ["yellow", "blue", "pink"];
            const positions = [
                { x: selectedNode.position.x - 220, y: selectedNode.position.y + 180 },
                { x: selectedNode.position.x, y: selectedNode.position.y + 220 },
                { x: selectedNode.position.x + 220, y: selectedNode.position.y + 180 },
            ];

            ideas.slice(0, 3).forEach((idea, i) => {
                const newId = addNote(positions[i].x, positions[i].y, colors[i]);
                setTimeout(() => {
                    updateNoteContent(newId, idea);
                }, 100);
                addEdge(selectedNodeId, newId);
            });
        } catch (error) {
            console.error("AI generation error:", error);
            alert(error instanceof Error ? error.message : "Failed to generate ideas");
        } finally {
            setIsGenerating(false);
        }
    }, [selectedNodeId, notes, addNote, updateNoteContent, addEdge, isGenerating]);

    // Export functionality
    const handleExport = useCallback(() => {
        const exportData = {
            notes: notes.map((n) => ({
                id: n.id,
                content: n.data.content,
                color: n.data.color,
                x: n.position.x,
                y: n.position.y,
            })),
            edges: syncedEdges,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `syncspace-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [notes, syncedEdges]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLInputElement
            ) {
                return;
            }

            if (e.key === "n" || e.key === "N") {
                e.preventDefault();
                handleAddNote();
            }

            if ((e.key === "m" || e.key === "M") && selectedNodeId) {
                e.preventDefault();
                handleMagic();
            }

            if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
                e.preventDefault();
                deleteNote(selectedNodeId);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAddNote, handleMagic, selectedNodeId, deleteNote]);

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-canvas)] bg-dot-pattern">
                <div className="flex flex-col items-center gap-4 px-6 py-4 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000]">
                    <div className="w-8 h-8 border-4 border-[var(--color-ink)] border-t-transparent animate-spin" />
                    <span className="font-display text-sm">Syncing canvas...</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.5 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    style: { stroke: "#111111", strokeWidth: 2 },
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1.5}
                    color="#00000020"
                />

                <Controls
                    showInteractive={false}
                    className="!shadow-[4px_4px_0px_0px_#000000] !border-2 !border-[var(--color-ink)] !rounded-none"
                />

                <MiniMap
                    nodeColor={(node) => {
                        const data = node.data as { color: string };
                        const colorMap: Record<string, string> = {
                            yellow: "#FFE600",
                            blue: "#3B82F6",
                            pink: "#EC4899",
                        };
                        return colorMap[data.color] || "#FFE600";
                    }}
                    className="!shadow-[4px_4px_0px_0px_#000000] !border-2 !border-[var(--color-ink)] !rounded-none"
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>

            {/* Sync indicator */}
            <div className="absolute bottom-20 left-4 z-40">
                <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000] ${isSynced ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    {isSynced ? 'Synced' : 'Syncing...'}
                </div>
            </div>

            {/* Loading overlay when generating */}
            {isGenerating && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-40">
                    <div className="flex flex-col items-center gap-3 px-6 py-4 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000]">
                        <div className="w-8 h-8 border-4 border-[var(--color-ink)] border-t-transparent animate-spin" />
                        <span className="font-display text-sm">AI is thinking...</span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <Toolbar
                onAddNote={handleAddNote}
                onUndo={() => { }}
                onRedo={() => { }}
                onMagic={handleMagic}
                onExport={handleExport}
                canUndo={false}
                canRedo={false}
                selectedNodeId={selectedNodeId}
                isGenerating={isGenerating}
            />
        </div>
    );
}
