"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

/**
 * Liveblocks Client Configuration
 * 
 * PRODUCTION-READY: Uses authEndpoint instead of publicApiKey
 * The secret key is safely stored on the server in /api/liveblocks-auth
 */
const client = createClient({
    // ✅ SECURE: Uses server-side auth endpoint (secret key never exposed)
    authEndpoint: "/api/liveblocks-auth",

    // Throttle cursor updates to ~60fps for smooth performance
    throttle: 16,
});

// Presence type - what each user shares with others
type Presence = {
    cursor: { x: number; y: number } | null;
    name: string;
    color: "yellow" | "blue" | "pink";
};

// Storage type - shared state synced across all users
type Storage = {
    // Y.js will handle the actual document sync
    // This is for any additional Liveblocks storage needs
};

// User metadata - comes from the auth endpoint
type UserMeta = {
    id: string;
    info: {
        name: string;
        color: "yellow" | "blue" | "pink";
    };
};

// Room event types
type RoomEvent = {
    type: "NOTIFICATION";
    message: string;
};

// Thread metadata (for comments)
type ThreadMetadata = Record<string, never>;

// Create the room context with typed presence, storage, and user meta
export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useOthersMapped,
    useSelf,
    useBroadcastEvent,
    useEventListener,
    useStorage,
    useMutation,
    useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
    client
);

// Create the global Liveblocks context
export const {
    LiveblocksProvider,
    useInboxNotifications,
    useUnreadInboxNotificationsCount,
} = createLiveblocksContext(client);
