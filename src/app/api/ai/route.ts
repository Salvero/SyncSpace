import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { checkRateLimit, checkDailyLimit, getClientIP } from "@/lib/rate-limit";

// Allow responses up to 30 seconds
export const maxDuration = 30;

// Rate limit: 5 requests per minute per IP (reduced from 10)
const RATE_LIMIT_CONFIG = {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
};

export async function POST(req: Request) {
    // Check rate limit first (per-minute limit)
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`ai:${clientIP}`, RATE_LIMIT_CONFIG);

    if (!rateLimit.success) {
        return new Response(
            JSON.stringify({
                error: "Too many requests. Please try again later.",
                retryAfter: rateLimit.resetIn,
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(rateLimit.resetIn),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(rateLimit.resetIn),
                },
            }
        );
    }

    // Check daily limits (per-user daily limit + global unique user cap)
    const dailyLimit = checkDailyLimit(clientIP);

    if (!dailyLimit.success) {
        const errorMessage = dailyLimit.reason === 'global_user_limit'
            ? "Daily user limit reached. AI feature is temporarily unavailable. Please try again tomorrow."
            : "You've reached your daily AI usage limit. Please try again tomorrow.";

        return new Response(
            JSON.stringify({
                error: errorMessage,
                reason: dailyLimit.reason,
                uniqueUsersToday: dailyLimit.uniqueUsersToday,
                maxUniqueUsers: dailyLimit.maxUniqueUsers,
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }

    // Validate API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return new Response(
            JSON.stringify({ error: "Gemini API key not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const { noteContent, contextNotes } = await req.json();

        if (!noteContent) {
            return new Response(
                JSON.stringify({ error: "Note content is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Build context from surrounding notes if provided
        const contextString = contextNotes?.length
            ? `\n\nContext from other notes:\n${contextNotes.join("\n")}`
            : "";

        const prompt = `You are a creative brainstorming assistant for SyncSpace, a collaborative canvas app.

The user has a note with this content: "${noteContent}"${contextString}

Generate exactly 3 related ideas that could branch from this note. Each idea should be:
- Brief (1-2 sentences max)
- Creative and inspiring
- Connected to the original idea but exploring different angles

Format your response as a JSON array with exactly 3 strings:
["Idea 1", "Idea 2", "Idea 3"]

Only output the JSON array, nothing else.`;

        console.log("Calling Gemini API with prompt for:", noteContent);

        const result = await generateText({
            model: google("gemini-2.0-flash-exp"),
            prompt,
        });

        console.log("Gemini response:", result.text);

        if (!result.text) {
            throw new Error("Empty response from Gemini");
        }

        return new Response(result.text, {
            headers: {
                "Content-Type": "text/plain",
                "X-RateLimit-Remaining": String(rateLimit.remaining),
                "X-RateLimit-Reset": String(rateLimit.resetIn),
            },
        });
    } catch (error) {
        console.error("AI generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate ideas";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
