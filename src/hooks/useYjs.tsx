"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useRoom } from "@/lib/liveblocks.config";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

interface YjsContextType {
    doc: Y.Doc | null;
    provider: LiveblocksYjsProvider | null;
    isLoading: boolean;
    isSynced: boolean;
    connectionStatus: ConnectionStatus;
}

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

const YjsContext = createContext<YjsContextType | null>(null);

export function YjsProvider({ children }: { children: ReactNode }) {
    const room = useRoom();
    const [doc, setDoc] = useState<Y.Doc | null>(null);
    const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const providerRef = useRef<LiveblocksYjsProvider | null>(null);
    const docRef = useRef<Y.Doc | null>(null);
    const initializingRef = useRef(false);

    useEffect(() => {
        if (providerRef.current || initializingRef.current) return;
        initializingRef.current = true;
        const yDoc = new Y.Doc();
        const yProvider = new LiveblocksYjsProvider(room, yDoc);
        docRef.current = yDoc;
        providerRef.current = yProvider;
        setDoc(yDoc);
        setProvider(yProvider);

        yProvider.on("sync", (synced: boolean) => {
            console.log("[Y.js] Sync status:", synced);
            setIsSynced(synced);
            setIsLoading(!synced);
            if (synced) setConnectionStatus("connected");
        });

        yProvider.on("status", ({ status }: { status: string }) => {
            console.log("[Y.js] Connection status:", status);
            setConnectionStatus((prev) => {
                if (status === "connected") return "connected";
                if (status === "connecting") return prev === "connected" ? "reconnecting" : "connecting";
                if (status === "disconnected") return "disconnected";
                return prev;
            });
        });

        return () => {
            yProvider.destroy();
            yDoc.destroy();
            providerRef.current = null;
            docRef.current = null;
            initializingRef.current = false;
        };
    }, [room]);

    return (
        <YjsContext.Provider value={{ doc, provider, isLoading, isSynced, connectionStatus }}>
            {children}
        </YjsContext.Provider>
    );
}

export function useYjs() {
    const context = useContext(YjsContext);
    if (!context) {
        throw new Error("useYjs must be used within a YjsProvider");
    }
    return context;
}

/**
 * Hook to sync note content with Y.Text for real-time collaboration.
 * Uses doc.getText(noteId) pattern for proper Y.js synchronization.
 */
export function useSyncedNoteContent(noteId: string) {
    const { doc, isSynced } = useYjs();
    const [content, setContent] = useState("");
    const yTextRef = useRef<Y.Text | null>(null);

    useEffect(() => {
        if (!doc || !noteId) {
            console.log("[useSyncedNoteContent] No doc or noteId", { doc: !!doc, noteId });
            return;
        }

        // Use doc.getText() pattern - this creates a named Y.Text at the document root
        // This is the correct way to create synced Y.Text instances
        const yText = doc.getText(`note:${noteId}`);
        yTextRef.current = yText;

        console.log("[useSyncedNoteContent] Initialized Y.Text for note:", noteId, "current content:", yText.toString());

        // Set initial content
        setContent(yText.toString());

        // Subscribe to changes from other users
        const observer = () => {
            const newContent = yText.toString();
            console.log("[useSyncedNoteContent] Y.Text changed:", noteId, "new content:", newContent);
            setContent(newContent);
        };
        yText.observe(observer);

        return () => {
            yText.unobserve(observer);
        };
    }, [doc, noteId, isSynced]);

    // Update content - this will sync to all users
    const updateContent = useCallback((newContent: string) => {
        if (!yTextRef.current) {
            console.log("[useSyncedNoteContent] No yText ref, can't update");
            return;
        }

        const yText = yTextRef.current;
        const currentContent = yText.toString();

        if (currentContent !== newContent) {
            console.log("[useSyncedNoteContent] Updating Y.Text:", { from: currentContent, to: newContent });
            // Delete all and insert new content
            yText.delete(0, currentContent.length);
            yText.insert(0, newContent);
        }
    }, []);

    // Handle textarea change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateContent(e.target.value);
    }, [updateContent]);

    return { content, handleChange, updateContent, yText: yTextRef.current };
}

/**
 * Initialize note text content (called when creating a note)
 */
export function initializeNoteText(doc: Y.Doc | null, noteId: string, initialContent: string = "") {
    if (!doc) return;

    // Use doc.getText() pattern
    const yText = doc.getText(`note:${noteId}`);
    if (yText.length === 0 && initialContent) {
        yText.insert(0, initialContent);
    }
    console.log("[initializeNoteText] Initialized note:", noteId);
}

/**
 * Delete note text (called when deleting a note)
 * Note: Y.Text created with doc.getText() cannot be fully deleted,
 * but we can clear its content.
 */
export function deleteNoteText(doc: Y.Doc | null, noteId: string) {
    if (!doc) return;

    const yText = doc.getText(`note:${noteId}`);
    yText.delete(0, yText.length);
    console.log("[deleteNoteText] Cleared note content:", noteId);
}
