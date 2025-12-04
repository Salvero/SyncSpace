import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { generateNanoName, getRandomPopColor } from "@/lib/utils";

/**
 * Liveblocks Authentication Endpoint
 * 
 * This is the PRODUCTION-READY way to authenticate users.
 * Uses the SECRET key (never exposed to browser).
 * 
 * For a real app, you would:
 * 1. Verify the user's session (Supabase Auth, NextAuth, etc.)
 * 2. Look up their permissions in your database
 * 3. Only allow access to authorized rooms
 */

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
    // Validate secret key is configured
    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
        console.error("LIVEBLOCKS_SECRET_KEY is not set");
        return new Response(
            JSON.stringify({ error: "Server configuration error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Get room info from request
        const { room } = await request.json();

        if (!room) {
            return new Response(
                JSON.stringify({ error: "Room ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ==============================================
        // TODO: Add your authentication logic here!
        // ==============================================
        // Example with Supabase:
        // const supabase = createServerClient(cookies());
        // const { data: { user } } = await supabase.auth.getUser();
        // if (!user) {
        //   return new Response("Unauthorized", { status: 401 });
        // }
        // 
        // Check if user has access to this room:
        // const { data: roomData } = await supabase
        //   .from('rooms')
        //   .select('*')
        //   .eq('id', room)
        //   .single();
        // 
        // if (!roomData || (roomData.owner_id !== user.id && !roomData.is_public)) {
        //   return new Response("Forbidden", { status: 403 });
        // }
        // ==============================================

        // Generate a unique user ID for this session
        // In production, use the actual user ID from your auth system
        const sessionId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        // Generate random Nano name and color for this user
        const userName = generateNanoName();
        const userColor = getRandomPopColor();

        // Create the Liveblocks session
        const session = liveblocks.prepareSession(sessionId, {
            userInfo: {
                name: userName,
                color: userColor,
            },
        });

        // Grant access to the requested room
        // In production, you would check permissions before granting access
        session.allow(room, session.FULL_ACCESS);

        // Authorize and return the token
        const { status, body } = await session.authorize();

        return new Response(body, {
            status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Liveblocks auth error:", error);
        return new Response(
            JSON.stringify({ error: "Authentication failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
