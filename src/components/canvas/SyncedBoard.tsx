"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    Connection,
    Edge,
    NodeChange,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NanoNote from "./NanoNote";
import { Toolbar } from "./Toolbar";
import { useSyncedCanvas, ConnectionStatus } from "@/hooks/useSyncedCanvas";
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
        connectionStatus,
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

    // Convert synced edges to React Flow format with mind-map styling
    const flowEdges: Edge[] = useMemo(() => {
        return syncedEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "smoothstep",
            animated: true,
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

    // Export as PNG
    const handleExportPNG = useCallback(async () => {
        const element = reactFlowWrapper.current;
        if (!element) return;

        try {
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(element, {
                backgroundColor: '#FFFCF0',
                quality: 1,
                pixelRatio: 2,
            });

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `syncspace-${Date.now()}.png`;
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export as PNG');
        }
    }, []);

    // Export as JSON
    const handleExportJSON = useCallback(() => {
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
            </ReactFlow>

            {/* Empty state - Welcome message when no notes */}
            {notes.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="flex flex-col items-center gap-6 text-center max-w-md px-8">
                        {/* Welcome icon */}
                        <div className="flex gap-3">
                            <div className="w-16 h-16 bg-[var(--color-pop-yellow)] border-3 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <div className="w-16 h-16 bg-[var(--color-pop-blue)] border-3 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                            </div>
                            <div className="w-16 h-16 bg-[var(--color-pop-pink)] border-3 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>

                        {/* Welcome text */}
                        <div>
                            <h2 className="font-display text-2xl mb-2">START BRAINSTORMING</h2>
                            <p className="text-[var(--color-ink)]/60 mb-4">
                                Create your first note and let AI help expand your ideas
                            </p>
                        </div>

                        {/* Quick tips */}
                        <div className="flex flex-wrap justify-center gap-3">
                            <div className="px-3 py-2 bg-[var(--color-pop-yellow)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]">
                                <span className="font-mono text-sm font-bold">N</span>
                                <span className="text-sm ml-2">Add Note</span>
                            </div>
                            <div className="px-3 py-2 bg-[var(--color-pop-pink)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000] text-white">
                                <span className="font-mono text-sm font-bold">M</span>
                                <span className="text-sm ml-2">AI Magic</span>
                            </div>
                            <div className="px-3 py-2 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000]">
                                <span className="font-mono text-sm font-bold">Drag</span>
                                <span className="text-sm ml-2">Connect</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync indicator */}
            <div className="absolute bottom-36 left-4 z-40">
                <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000] ${
                    connectionStatus === 'connected' && isSynced ? 'bg-green-100' :
                    connectionStatus === 'disconnected' ? 'bg-red-100' :
                    'bg-yellow-100'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' && isSynced ? 'bg-green-500' :
                        connectionStatus === 'disconnected' ? 'bg-red-500' :
                        'bg-yellow-500 animate-pulse'
                    }`} />
                    {connectionStatus === 'connected' && isSynced ? 'Synced' :
                     connectionStatus === 'disconnected' ? 'Disconnected' :
                     connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                     'Syncing...'}
                </div>
            </div>

            {/* Brainstorming overlay when generating */}
            {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20">
                    <div className="flex flex-col items-center gap-4 px-10 py-8 bg-[var(--color-pop-pink)] border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_#000000] animate-pulse">
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            className="animate-spin"
                        >
                            <path d="M8 2L9.09 5.26L12.5 5.27L9.73 7.27L10.82 10.53L8 8.53L5.18 10.53L6.27 7.27L3.5 5.27L6.91 5.26L8 2Z" />
                        </svg>
                        <span className="font-display text-2xl text-white">Brainstorming...</span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <Toolbar
                onAddNote={handleAddNote}
                onUndo={() => { }}
                onRedo={() => { }}
                onMagic={handleMagic}
                onExport={handleExportPNG}
                canUndo={false}
                canRedo={false}
                selectedNodeId={selectedNodeId}
                isGenerating={isGenerating}
            />
        </div>
    );
}
