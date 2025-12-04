"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    NodeChange,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NanoNote from "./NanoNote";
import { Toolbar } from "./Toolbar";
import { useCanvasStore } from "@/hooks/useStore";
import type { NanoNoteNode } from "@/lib/types";

// Register custom node types
const nodeTypes = {
    nanoNote: NanoNote,
};

interface BoardProps {
    roomId?: string;
}

export default function Board({ roomId }: BoardProps) {
    const {
        nodes: storeNodes,
        selectedNodeId,
        addNote,
        updateNoteContent,
        updateNoteColor,
        updateNotePosition,
        deleteNote,
        setSelectedNode,
        undo,
        redo,
        canUndo,
        canRedo,
        pushHistory,
    } = useCanvasStore();

    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // Convert store nodes to React Flow nodes with handlers
    const flowNodes = useMemo(() => {
        return storeNodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                onContentChange: updateNoteContent,
                onColorChange: updateNoteColor,
                onDelete: deleteNote,
            },
        }));
    }, [storeNodes, updateNoteContent, updateNoteColor, deleteNote]);

    // Handle node changes (position, selection, etc.)
    const onNodesChange = useCallback(
        (changes: NodeChange<NanoNoteNode>[]) => {
            changes.forEach((change) => {
                if (change.type === "position" && change.position) {
                    updateNotePosition(change.id, change.position.x, change.position.y);
                }
                if (change.type === "select") {
                    if (change.selected) {
                        setSelectedNode(change.id);
                    } else if (selectedNodeId === change.id) {
                        setSelectedNode(null);
                    }
                }
            });
        },
        [updateNotePosition, setSelectedNode, selectedNodeId]
    );

    // Handle drag stop to record history
    const onNodeDragStop = useCallback(() => {
        pushHistory();
    }, [pushHistory]);

    // Handle edge connections
    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        style: { stroke: "#111111", strokeWidth: 2 },
                    },
                    eds
                )
            );
        },
        [setEdges]
    );

    // Add note at center of viewport
    const handleAddNote = useCallback(() => {
        const x = 200 + Math.random() * 300;
        const y = 200 + Math.random() * 200;
        addNote(x, y);
    }, [addNote]);

    // Magic (AI) functionality - calls Gemini API
    const handleMagic = useCallback(async () => {
        if (!selectedNodeId || isGenerating) return;

        const selectedNode = storeNodes.find((n) => n.id === selectedNodeId);
        if (!selectedNode) return;

        const noteContent = selectedNode.data.content;
        if (!noteContent.trim()) {
            alert("Please add some content to the note first!");
            return;
        }

        setIsGenerating(true);

        try {
            // Get context from nearby notes
            const contextNotes = storeNodes
                .filter((n) => n.id !== selectedNodeId && n.data.content.trim())
                .slice(0, 3)
                .map((n) => n.data.content);

            // Call the AI API
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteContent, contextNotes }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate ideas");
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            let fullText = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
            }

            // Parse the JSON array from the response
            // The AI returns something like: ["Idea 1", "Idea 2", "Idea 3"]
            let ideas: string[];
            try {
                // Find the JSON array in the response
                const jsonMatch = fullText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    ideas = JSON.parse(jsonMatch[0]);
                } else {
                    // Fallback: split by newlines if no JSON found
                    ideas = fullText.split("\n").filter((line) => line.trim()).slice(0, 3);
                }
            } catch {
                // If parsing fails, create placeholder ideas
                ideas = [
                    "Related idea 1",
                    "Related idea 2",
                    "Related idea 3"
                ];
            }

            // Create 3 new notes with the AI-generated ideas
            const colors: Array<"yellow" | "blue" | "pink"> = ["yellow", "blue", "pink"];
            const positions = [
                { x: selectedNode.position.x - 220, y: selectedNode.position.y + 180 },
                { x: selectedNode.position.x, y: selectedNode.position.y + 220 },
                { x: selectedNode.position.x + 220, y: selectedNode.position.y + 180 },
            ];

            ideas.slice(0, 3).forEach((idea, i) => {
                const newId = addNote(positions[i].x, positions[i].y, colors[i]);
                // Update the note content with the AI idea
                setTimeout(() => {
                    updateNoteContent(newId, idea);
                }, 100);
                // Add edge from selected node to new node
                setEdges((eds) =>
                    addEdge(
                        {
                            id: `e-${selectedNodeId}-${newId}`,
                            source: selectedNodeId,
                            target: newId,
                            style: { stroke: "#111111", strokeWidth: 2 },
                        },
                        eds
                    )
                );
            });

        } catch (error) {
            console.error("AI generation error:", error);
            alert(error instanceof Error ? error.message : "Failed to generate ideas. Check your API key.");
        } finally {
            setIsGenerating(false);
        }
    }, [selectedNodeId, storeNodes, addNote, updateNoteContent, setEdges, isGenerating]);

    // Export functionality
    const handleExport = useCallback(() => {
        const exportData = {
            nodes: storeNodes,
            edges,
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
    }, [storeNodes, edges]);

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

            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
                e.preventDefault();
                redo();
            }

            if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
                e.preventDefault();
                deleteNote(selectedNodeId);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAddNote, handleMagic, undo, redo, selectedNodeId, deleteNote]);

    return (
        <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
                nodes={flowNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
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
                onUndo={undo}
                onRedo={redo}
                onMagic={handleMagic}
                onExport={handleExport}
                canUndo={canUndo()}
                canRedo={canRedo()}
                selectedNodeId={selectedNodeId}
                isGenerating={isGenerating}
            />
        </div>
    );
}

