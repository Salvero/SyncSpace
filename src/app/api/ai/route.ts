import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    // Validate API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
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

        const result = streamText({
            model: google("gemini-1.5-flash"),
            prompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI generation error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate ideas" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
