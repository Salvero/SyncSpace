"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { Room, useCursorPresence } from "@/components/Room";
import { CursorsOverlay, PresenceIndicator } from "@/components/canvas/Cursor";
import { Logo } from "@/components/Logo";

// Share button with copy-to-clipboard
function ShareButton({ roomId }: { roomId: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const url = `${window.location.origin}/room/${roomId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-[var(--color-ink)]/10 rounded transition-colors"
            title="Copy room link"
            aria-label="Copy room link"
        >
            {copied ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8L6 11L13 4" />
                </svg>
            ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="5" width="8" height="9" rx="1" />
                    <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5" />
                </svg>
            )}
        </button>
    );
}

// Dynamically import SyncedBoard to avoid SSR issues with React Flow
const SyncedBoard = dynamic(() => import("@/components/canvas/SyncedBoard"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-mesh bg-dot-pattern">
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
            className="w-full h-screen bg-mesh overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
        >
            {/* Header with Logo */}
            <div className="absolute top-4 left-4 z-50">
                <a href="/" className="block hover:opacity-80 transition-opacity">
                    <Logo size="lg" showText={true} />
                </a>
            </div>

            {/* Presence indicator - shows YOUR name */}
            <PresenceIndicator
                myName={myName}
                myColor={myColor}
                othersCount={othersCount}
            />

            {/* Room ID indicator with Share button */}
            <div className="absolute top-16 right-4 z-50">
                <div className="flex flex-col items-end gap-1 px-4 py-2 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[3px_3px_0px_0px_#000000]">
                    <span className="text-xs font-medium text-[var(--color-ink)]/60 uppercase tracking-wide">
                        Room ID
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-bold text-[var(--color-ink)]">
                            {roomId.slice(0, 8)}
                        </span>
                        <ShareButton roomId={roomId} />
                    </div>
                </div>
            </div>

            {/* Back to home button */}
            <a
                href="/"
                className="absolute top-4 right-4 z-50 px-3 py-1.5 text-sm font-medium border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-100"
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
