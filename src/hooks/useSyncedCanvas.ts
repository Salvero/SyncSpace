"use client";

import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { useYjs, initializeNoteText, deleteNoteText, ConnectionStatus } from "./useYjs";
import type { NanoNoteNode, PopColor } from "@/lib/types";

// Type for the note metadata stored in Y.js (content is stored separately in Y.Text)
interface YNoteData {
    id: string;
    color: PopColor;
    x: number;
    y: number;
    createdAt: string;
}

// Type for edges stored in Y.js
interface YEdgeData {
    id: string;
    source: string;
    target: string;
}

export type { ConnectionStatus };

export function useSyncedCanvas() {
    const { doc, isLoading, isSynced, connectionStatus } = useYjs();
    const [notes, setNotes] = useState<NanoNoteNode[]>([]);
    const [edges, setEdges] = useState<YEdgeData[]>([]);

    // Subscribe to Y.js changes for notes metadata and edges
    useEffect(() => {
        if (!doc) return;

        const yNotes = doc.getArray<YNoteData>("notes");
        const yEdges = doc.getArray<YEdgeData>("edges");

        // Convert Y.js data to React Flow nodes
        const updateNotes = () => {
            const notesData = yNotes.toArray();
            const flowNodes: NanoNoteNode[] = notesData.map((note) => {
                // Get content from Y.Text using doc.getText() pattern
                const yText = doc.getText(`note:${note.id}`);
                const content = yText.toString();

                return {
                    id: note.id,
                    type: "nanoNote",
                    position: { x: note.x, y: note.y },
                    data: {
                        content,
                        color: note.color,
                        createdAt: note.createdAt,
                    },
                };
            });
            setNotes(flowNodes);
        };

        const updateEdges = () => {
            setEdges(yEdges.toArray());
        };

        // Initial load
        updateNotes();
        updateEdges();

        // Subscribe to changes in notes array and edges
        yNotes.observe(updateNotes);
        yEdges.observe(updateEdges);

        // Note: Y.Text updates are handled by useSyncedNoteContent hook in NanoNote
        // We don't need to observe individual Y.Text here since NanoNote manages its own content

        return () => {
            yNotes.unobserve(updateNotes);
            yEdges.unobserve(updateEdges);
        };
    }, [doc]);

    // Add a new note
    const addNote = useCallback(
        (x: number, y: number, color: PopColor = "yellow"): string => {
            if (!doc) return "";

            const yNotes = doc.getArray<YNoteData>("notes");
            const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

            const noteData: YNoteData = {
                id,
                color,
                x,
                y,
                createdAt: new Date().toISOString(),
            };

            // Initialize Y.Text for this note
            initializeNoteText(doc, id, "");

            yNotes.push([noteData]);
            return id;
        },
        [doc]
    );

    // Update note content - this is now handled by useSyncedNoteContent hook
    // This function is kept for backwards compatibility (e.g., AI-generated content)
    const updateNoteContent = useCallback(
        (id: string, content: string) => {
            if (!doc) return;

            // Use doc.getText() pattern for proper sync
            const yText = doc.getText(`note:${id}`);

            // Replace content
            const currentContent = yText.toString();
            if (currentContent !== content) {
                yText.delete(0, currentContent.length);
                yText.insert(0, content);
            }
        },
        [doc]
    );

    // Update note color
    const updateNoteColor = useCallback(
        (id: string, color: PopColor) => {
            if (!doc) return;

            const yNotes = doc.getArray<YNoteData>("notes");
            const index = yNotes.toArray().findIndex((n) => n.id === id);

            if (index !== -1) {
                doc.transact(() => {
                    const note = yNotes.get(index);
                    yNotes.delete(index, 1);
                    yNotes.insert(index, [{ ...note, color }]);
                });
            }
        },
        [doc]
    );

    // Update note position
    const updateNotePosition = useCallback(
        (id: string, x: number, y: number) => {
            if (!doc) return;

            const yNotes = doc.getArray<YNoteData>("notes");
            const index = yNotes.toArray().findIndex((n) => n.id === id);

            if (index !== -1) {
                doc.transact(() => {
                    const note = yNotes.get(index);
                    yNotes.delete(index, 1);
                    yNotes.insert(index, [{ ...note, x, y }]);
                });
            }
        },
        [doc]
    );

    // Delete a note
    const deleteNote = useCallback(
        (id: string) => {
            if (!doc) return;

            const yNotes = doc.getArray<YNoteData>("notes");
            const yEdges = doc.getArray<YEdgeData>("edges");

            doc.transact(() => {
                // Delete the note metadata
                const noteIndex = yNotes.toArray().findIndex((n) => n.id === id);
                if (noteIndex !== -1) {
                    yNotes.delete(noteIndex, 1);
                }

                // Delete the Y.Text content
                deleteNoteText(doc, id);

                // Delete connected edges
                const edgesToDelete = yEdges
                    .toArray()
                    .map((e, i) => (e.source === id || e.target === id ? i : -1))
                    .filter((i) => i !== -1)
                    .reverse();

                edgesToDelete.forEach((index) => {
                    yEdges.delete(index, 1);
                });
            });
        },
        [doc]
    );

    // Add an edge
    const addEdge = useCallback(
        (source: string, target: string): string => {
            if (!doc) return "";

            const yEdges = doc.getArray<YEdgeData>("edges");
            const id = `edge-${source}-${target}`;

            // Check if edge already exists
            const exists = yEdges.toArray().some((e) => e.id === id);
            if (!exists) {
                yEdges.push([{ id, source, target }]);
            }

            return id;
        },
        [doc]
    );

    return {
        notes,
        edges,
        isLoading,
        isSynced,
        connectionStatus,
        addNote,
        updateNoteContent,
        updateNoteColor,
        updateNotePosition,
        deleteNote,
        addEdge,
    };
}

