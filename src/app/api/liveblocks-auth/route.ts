import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNanoName, getRandomPopColor } from "@/lib/utils";

/**
 * Liveblocks Authentication Endpoint
 * 
 * Production-ready: Uses Supabase for user authentication.
 * Anonymous users get random Nano names, authenticated users get their email.
 */

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
        console.error("LIVEBLOCKS_SECRET_KEY is not set");
        return new Response(
            JSON.stringify({ error: "Server configuration error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const { room } = await request.json();

        if (!room) {
            return new Response(
                JSON.stringify({ error: "Room ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if user is authenticated
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let sessionId: string;
        let userName: string;
        let userColor: "yellow" | "blue" | "pink";

        if (user) {
            // Authenticated user - use their info
            sessionId = user.id;
            userName = user.email?.split("@")[0] || generateNanoName();
            // Generate consistent color based on user ID
            const colors: Array<"yellow" | "blue" | "pink"> = ["yellow", "blue", "pink"];
            userColor = colors[user.email?.charCodeAt(0) ?? 0 % 3];
        } else {
            // Anonymous user - generate random info
            sessionId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            userName = generateNanoName();
            userColor = getRandomPopColor();
        }

        // Create the Liveblocks session
        const session = liveblocks.prepareSession(sessionId, {
            userInfo: {
                name: userName,
                color: userColor,
            },
        });

        // Grant full access to the room
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
