"use client";

import { ReactNode } from "react";
import {
    RoomProvider,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useSelf,
} from "@/lib/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { YjsProvider } from "@/hooks/useYjs";
import type { PopColor } from "@/lib/types";

interface RoomProps {
    roomId: string;
    children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
    return (
        <RoomProvider
            id={roomId}
            initialPresence={{
                cursor: null,
                // These will be overwritten by userInfo from auth endpoint
                name: "Loading...",
                color: "yellow",
            }}
        >
            <ClientSideSuspense
                fallback={
                    <div className="w-full h-full flex items-center justify-center bg-[var(--color-canvas)]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[var(--color-ink)] border-t-transparent animate-spin" />
                            <span className="font-display text-lg">Connecting...</span>
                        </div>
                    </div>
                }
            >
                <YjsProvider>
                    {children}
                </YjsProvider>
            </ClientSideSuspense>
        </RoomProvider>
    );
}

// Hook to track cursor position and broadcast to others
export function useCursorPresence() {
    const updateMyPresence = useUpdateMyPresence();
    const others = useOthers();
    const self = useSelf();

    const handlePointerMove = (e: React.PointerEvent) => {
        updateMyPresence({
            cursor: { x: e.clientX, y: e.clientY },
        });
    };

    const handlePointerLeave = () => {
        updateMyPresence({ cursor: null });
    };

    const otherCursors = others
        .filter((user) => user.presence.cursor !== null)
        .map((user) => ({
            id: user.connectionId.toString(),
            x: user.presence.cursor!.x,
            y: user.presence.cursor!.y,
            // Get name/color from userInfo (set by auth endpoint) or presence
            name: user.info?.name || user.presence.name,
            color: (user.info?.color || user.presence.color) as PopColor,
        }));

    // Get own info from userInfo (set by auth endpoint)
    const myName = self?.info?.name || self?.presence.name || "You";
    const myColor = (self?.info?.color || self?.presence.color || "yellow") as PopColor;

    return {
        handlePointerMove,
        handlePointerLeave,
        otherCursors,
        myName,
        myColor,
        othersCount: others.length,
    };
}
