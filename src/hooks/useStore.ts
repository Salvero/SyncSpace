"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { NanoNoteNode } from "@/lib/types";

interface HistoryState {
    nodes: NanoNoteNode[];
}

interface CanvasStore {
    // State
    nodes: NanoNoteNode[];
    selectedNodeId: string | null;

    // History for undo/redo
    history: HistoryState[];
    historyIndex: number;

    // Actions
    addNote: (x?: number, y?: number, color?: "yellow" | "blue" | "pink") => string;
    updateNoteContent: (id: string, content: string) => void;
    updateNoteColor: (id: string, color: "yellow" | "blue" | "pink") => void;
    updateNotePosition: (id: string, x: number, y: number) => void;
    deleteNote: (id: string) => void;
    setSelectedNode: (id: string | null) => void;
    setNodes: (nodes: NanoNoteNode[]) => void;

    // History actions
    undo: () => void;
    redo: () => void;
    pushHistory: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
    // Initial state
    nodes: [],
    selectedNodeId: null,
    history: [],
    historyIndex: -1,

    // Add a new note
    addNote: (x = 100, y = 100, color = "yellow") => {
        const id = uuidv4();
        const newNode: NanoNoteNode = {
            id,
            type: "nanoNote",
            position: { x, y },
            data: {
                content: "",
                color,
            },
        };

        get().pushHistory();

        set((state) => ({
            nodes: [...state.nodes, newNode],
            selectedNodeId: id,
        }));

        return id;
    },

    // Update note content
    updateNoteContent: (id, content) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, content } }
                    : node
            ),
        }));
    },

    // Update note color
    updateNoteColor: (id, color) => {
        get().pushHistory();
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, color } }
                    : node
            ),
        }));
    },

    // Update note position
    updateNotePosition: (id, x, y) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id
                    ? { ...node, position: { x, y } }
                    : node
            ),
        }));
    },

    // Delete a note
    deleteNote: (id) => {
        get().pushHistory();
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
    },

    // Set selected node
    setSelectedNode: (id) => set({ selectedNodeId: id }),

    // Set all nodes (for sync)
    setNodes: (nodes) => set({ nodes }),

    // Push current state to history
    pushHistory: () => {
        const { nodes, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)) });

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
        }

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    // Undo
    undo: () => {
        const { history, historyIndex, nodes } = get();

        if (historyIndex < 0) return;

        // If we're at the latest state, save current state first
        if (historyIndex === history.length - 1) {
            const newHistory = [...history, { nodes: JSON.parse(JSON.stringify(nodes)) }];
            set({
                nodes: history[historyIndex].nodes,
                history: newHistory,
                historyIndex: historyIndex - 1,
            });
        } else {
            set({
                nodes: history[historyIndex].nodes,
                historyIndex: historyIndex - 1,
            });
        }
    },

    // Redo
    redo: () => {
        const { history, historyIndex } = get();

        if (historyIndex >= history.length - 1) return;

        set({
            nodes: history[historyIndex + 1].nodes,
            historyIndex: historyIndex + 1,
        });
    },

    // Check if can undo
    canUndo: () => get().historyIndex >= 0,

    // Check if can redo
    canRedo: () => get().historyIndex < get().history.length - 1,
}));
