"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                setError("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--color-canvas)] bg-dot-pattern flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <Logo size="lg" showText={false} className="mb-4" />
                    <h1 className="font-display text-4xl mb-2">
                        SYNC<span className="text-[var(--color-pop-pink)]">SPACE</span>
                    </h1>
                    <p className="text-[var(--color-ink)]/60">
                        {isSignUp ? "Create your account" : "Welcome back"}
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-[var(--color-canvas)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_#000000] p-6"
                >
                    {error && (
                        <div
                            className={`mb-4 p-3 border-2 border-[var(--color-ink)] text-sm ${error.includes("Check your email")
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                        >
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium mb-1"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pop-yellow)]"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border-2 border-[var(--color-ink)] bg-[var(--color-canvas)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pop-yellow)]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="yellow"
                        className="w-full mt-6"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Loading..."
                            : isSignUp
                                ? "Create Account"
                                : "Sign In"}
                    </Button>

                    <div className="mt-4 text-center text-sm">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[var(--color-pop-blue)] hover:underline"
                        >
                            {isSignUp
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </form>

                {/* Back link */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-sm text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]"
                    >
                        ← Back to home
                    </a>
                </div>
            </div>
        </main>
    );
}
