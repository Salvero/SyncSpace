"use client";

import { useEffect, useState, useCallback } from "react";
import { useRoom } from "@/lib/liveblocks.config";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import type { NanoNoteNode, PopColor } from "@/lib/types";

// Type for the note data stored in Y.js
interface YNoteData {
    id: string;
    content: string;
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

export function useSyncedCanvas() {
    const room = useRoom();
    const [doc, setDoc] = useState<Y.Doc | null>(null);
    const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
    const [notes, setNotes] = useState<NanoNoteNode[]>([]);
    const [edges, setEdges] = useState<YEdgeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(false);

    // Initialize Y.js document and provider
    useEffect(() => {
        const yDoc = new Y.Doc();
        const yProvider = new LiveblocksYjsProvider(room, yDoc);

        setDoc(yDoc);
        setProvider(yProvider);

        // Wait for sync
        yProvider.on("sync", (synced: boolean) => {
            setIsSynced(synced);
            setIsLoading(!synced);
        });

        return () => {
            yProvider.destroy();
            yDoc.destroy();
        };
    }, [room]);

    // Subscribe to Y.js changes
    useEffect(() => {
        if (!doc) return;

        const yNotes = doc.getArray<YNoteData>("notes");
        const yEdges = doc.getArray<YEdgeData>("edges");

        // Convert Y.js data to React Flow nodes
        const updateNotes = () => {
            const notesData = yNotes.toArray();
            const flowNodes: NanoNoteNode[] = notesData.map((note) => ({
                id: note.id,
                type: "nanoNote",
                position: { x: note.x, y: note.y },
                data: {
                    content: note.content,
                    color: note.color,
                    createdAt: note.createdAt,
                },
            }));
            setNotes(flowNodes);
        };

        const updateEdges = () => {
            setEdges(yEdges.toArray());
        };

        // Initial load
        updateNotes();
        updateEdges();

        // Subscribe to changes
        yNotes.observe(updateNotes);
        yEdges.observe(updateEdges);

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
                content: "",
                color,
                x,
                y,
                createdAt: new Date().toISOString(),
            };

            yNotes.push([noteData]);
            return id;
        },
        [doc]
    );

    // Update note content
    const updateNoteContent = useCallback(
        (id: string, content: string) => {
            if (!doc) return;

            const yNotes = doc.getArray<YNoteData>("notes");
            const index = yNotes.toArray().findIndex((n) => n.id === id);

            if (index !== -1) {
                doc.transact(() => {
                    const note = yNotes.get(index);
                    yNotes.delete(index, 1);
                    yNotes.insert(index, [{ ...note, content }]);
                });
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
                // Delete the note
                const noteIndex = yNotes.toArray().findIndex((n) => n.id === id);
                if (noteIndex !== -1) {
                    yNotes.delete(noteIndex, 1);
                }

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
        addNote,
        updateNoteContent,
        updateNoteColor,
        updateNotePosition,
        deleteNote,
        addEdge,
    };
}
