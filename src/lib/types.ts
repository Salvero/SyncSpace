// Pop colors used throughout the app
export type PopColor = "yellow" | "blue" | "pink" | "green" | "purple" | "orange";

// NanoNote type - the core data structure for canvas notes
export interface NanoNote {
    id: string;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: PopColor;
    author_id?: string;
    created_at?: string;
}

// Room type for Supabase
export interface Room {
    id: string;
    created_at: string;
    owner_id: string;
    is_public: boolean;
    snapshot_url?: string;
}

// Cursor presence type for Liveblocks
export interface CursorPresence {
    cursor: { x: number; y: number } | null;
    name: string;
    color: PopColor;
}

// React Flow Node type extending NanoNote
export interface NanoNoteNode {
    id: string;
    type: "nanoNote";
    position: { x: number; y: number };
    data: {
        content: string;
        color: PopColor;
        createdAt?: string;
        onContentChange?: (id: string, content: string) => void;
        onColorChange?: (id: string, color: PopColor) => void;
        onDelete?: (id: string) => void;
    };
    width?: number;
    height?: number;
}
