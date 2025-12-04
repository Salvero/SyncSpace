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
export function getRandomPopColor(): "yellow" | "blue" | "pink" {
  const colors = ["yellow", "blue", "pink"] as const;
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get CSS color value from pop color name
 */
export function getPopColorValue(color: "yellow" | "blue" | "pink"): string {
  const colorMap = {
    yellow: "#FFE600",
    blue: "#3B82F6",
    pink: "#EC4899",
  };
  return colorMap[color];
}
