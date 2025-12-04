"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { getPopColorValue } from "@/lib/utils";

export function UserMenu() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="w-8 h-8 border-2 border-[var(--color-ink)] border-t-transparent animate-spin" />
        );
    }

    if (!user) {
        return (
            <Button
                onClick={() => router.push("/login")}
                variant="default"
                size="sm"
            >
                Sign In
            </Button>
        );
    }

    // Get user initial for avatar
    const initial = user.email?.charAt(0).toUpperCase() || "U";
    const colors = ["yellow", "blue", "pink"] as const;
    const colorIndex = user.email?.charCodeAt(0) ?? 0;
    const userColor = colors[colorIndex % 3];

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 border-2 border-[var(--color-ink)] shadow-[2px_2px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-100"
                style={{ backgroundColor: getPopColorValue(userColor) }}
            >
                <span
                    className="w-6 h-6 flex items-center justify-center text-sm font-bold border-2 border-[var(--color-ink)]"
                    style={{
                        backgroundColor: "white",
                        color: "#111111",
                    }}
                >
                    {initial}
                </span>
                <span
                    className={`text-sm font-medium ${userColor === "yellow" ? "text-[var(--color-ink)]" : "text-white"
                        }`}
                >
                    {user.email?.split("@")[0]}
                </span>
            </button>

            {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] z-50">
                    <div className="p-3 border-b border-[var(--color-ink)]/20">
                        <p className="text-xs text-[var(--color-ink)]/50">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-ink)]/5 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
