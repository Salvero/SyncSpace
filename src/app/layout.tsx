import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncSpace - Real-time Collaborative Canvas",
  description: "High-performance infinite canvas for rapid brainstorming with real-time multiplayer collaboration.",
  keywords: ["canvas", "brainstorming", "collaboration", "real-time", "whiteboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
