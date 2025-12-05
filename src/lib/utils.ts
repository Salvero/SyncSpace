import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for conditional className handling
 * Usage: cn("base-class", condition && "conditional-class", "override-class")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate random "Nano" style name for multiplayer cursors
 */
const prefixes = ["Neon", "Cyber", "Pixel", "Nano", "Hyper", "Mega", "Ultra", "Turbo"];
const animals = ["Cat", "Dog", "Fox", "Owl", "Bear", "Wolf", "Tiger", "Panda", "Koala", "Bunny"];

export function generateNanoName(): string {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${prefix} ${animal}`;
}

/**
 * Generate a random pop color for cursors
 */
export function getRandomPopColor(): "yellow" | "blue" | "pink" | "green" | "purple" | "orange" {
  const colors = ["yellow", "blue", "pink", "green", "purple", "orange"] as const;
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get CSS color value from pop color name
 */
export function getPopColorValue(color: "yellow" | "blue" | "pink" | "green" | "purple" | "orange"): string {
  const colorMap = {
    yellow: "#FFE600",
    blue: "#3B82F6",
    pink: "#EC4899",
    green: "#10B981",
    purple: "#8B5CF6",
    orange: "#F97316",
  };
  return colorMap[color];
}

/**
 * Get a different color from the parent (for AI-generated notes)
 */
export function getAlternateColor(parentColor: "yellow" | "blue" | "pink" | "green" | "purple" | "orange"): "yellow" | "blue" | "pink" | "green" | "purple" | "orange" {
  const allColors = ["yellow", "blue", "pink", "green", "purple", "orange"] as const;
  const otherColors = allColors.filter(c => c !== parentColor);
  return otherColors[Math.floor(Math.random() * otherColors.length)];
}
