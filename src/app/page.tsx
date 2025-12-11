"use client";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/UserMenu";
import { Logo } from "@/components/Logo";

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = uuidv4();
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen bg-mesh bg-dot-pattern flex flex-col items-center justify-center p-8">
      {/* User Menu - Top Right */}
      <div className="absolute top-6 right-6">
        <UserMenu />
      </div>

      {/* Hero Section */}
      <div className="max-w-2xl text-center flex flex-col items-center">
        {/* Logo */}
        <Logo size="xl" showText={false} className="mb-6" />

        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl mb-4 tracking-tight">
          SYNC<span className="text-[var(--color-pop-pink)]">SPACE</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-[var(--color-ink)]/70 mb-2">
          Real-time Collaborative Canvas
        </p>
        <p className="text-base text-[var(--color-ink)]/50 mb-12">
          Rapid brainstorming. Keyboard-first. No friction.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { label: "Infinite Canvas", color: "yellow" },
            { label: "Real-time Sync", color: "blue" },
            { label: "AI Teammate", color: "pink" },
          ].map((feature) => (
            <span
              key={feature.label}
              className={`
                px-4 py-2 text-sm font-medium
                border-2 border-[var(--color-ink)]
                shadow-[2px_2px_0px_0px_#000000]
                ${feature.color === "blue" || feature.color === "pink" ? "text-white" : "text-[var(--color-ink)]"}
              `}
              style={{
                backgroundColor:
                  feature.color === "yellow"
                    ? "#FFE600"
                    : feature.color === "blue"
                      ? "#3B82F6"
                      : "#EC4899",
              }}
            >
              {feature.label}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleCreateRoom}
          variant="yellow"
          size="lg"
          className="text-lg font-display"
        >
          CREATE NEW ROOM →
        </Button>

        {/* Keyboard shortcut hint */}
        <p className="mt-8 text-sm text-[var(--color-ink)]/40 font-mono">
          Press <kbd className="px-2 py-1 bg-[var(--color-ink)]/10 border border-[var(--color-ink)]/20">N</kbd> to add notes •
          <kbd className="px-2 py-1 bg-[var(--color-ink)]/10 border border-[var(--color-ink)]/20 ml-2">M</kbd> for AI magic
        </p>
      </div>
    </main>
  );
}
