"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Room, useCursorPresence } from "@/components/Room";
import { CursorsOverlay, PresenceIndicator } from "@/components/canvas/Cursor";

// Dynamically import SyncedBoard to avoid SSR issues with React Flow
const SyncedBoard = dynamic(() => import("@/components/canvas/SyncedBoard"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--color-canvas)] bg-dot-pattern">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[var(--color-ink)] border-t-transparent animate-spin" />
                <span className="font-display text-lg">Loading Canvas...</span>
            </div>
        </div>
    ),
});

interface RoomPageProps {
    params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
    const { roomId } = use(params);

    return (
        <Room roomId={roomId}>
            <CollaborativeCanvas roomId={roomId} />
        </Room>
    );
}

// Inner component that uses Liveblocks hooks
function CollaborativeCanvas({ roomId }: { roomId: string }) {
    const { handlePointerMove, handlePointerLeave, otherCursors, myName, myColor, othersCount } = useCursorPresence();

    return (
        <div
            className="w-full h-screen bg-[var(--color-canvas)] overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
        >
            {/* Presence indicator - shows YOUR name */}
            <PresenceIndicator
                myName={myName}
                myColor={myColor}
                othersCount={othersCount}
            />

            {/* Room ID indicator */}
            <div className="absolute top-16 left-4 z-50 flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--color-ink)]/50">
                    Room:
                </span>
                <span className="px-2 py-1 text-xs font-mono bg-[var(--color-ink)]/5 border border-[var(--color-ink)]/20">
                    {roomId.slice(0, 8)}...
                </span>
            </div>

            {/* Back to home button */}
            <a
                href="/"
                className="absolute top-16 right-4 z-50 px-3 py-1.5 text-sm font-medium border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-100"
                aria-label="Back to home"
            >
                ← Home
            </a>

            {/* Other users' cursors */}
            <CursorsOverlay cursors={otherCursors} />

            {/* Synced Canvas with Y.js */}
            <SyncedBoard />
        </div>
    );
}
