// NanoNote type - the core data structure for canvas notes
export interface NanoNote {
    id: string;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: "yellow" | "blue" | "pink";
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
    color: "yellow" | "blue" | "pink";
}

// React Flow Node type extending NanoNote
export interface NanoNoteNode {
    id: string;
    type: "nanoNote";
    position: { x: number; y: number };
    data: {
        content: string;
        color: "yellow" | "blue" | "pink";
        onContentChange?: (id: string, content: string) => void;
        onColorChange?: (id: string, color: "yellow" | "blue" | "pink") => void;
        onDelete?: (id: string) => void;
    };
    width?: number;
    height?: number;
}
