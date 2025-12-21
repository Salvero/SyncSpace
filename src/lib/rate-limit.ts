/**
 * Simple in-memory rate limiter for API routes
 *
 * Note: This resets on server restart and doesn't work across multiple instances.
 * For production at scale, consider using Redis or a dedicated rate limiting service.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Daily limit tracking
interface DailyLimitEntry {
    count: number;
    resetDate: string; // YYYY-MM-DD format
}

// Configuration for daily limits
const DAILY_CONFIG = {
    maxRequestsPerUserPerDay: 20, // Max AI calls per user per day
    maxUniqueUsersPerDay: 4,      // Max unique users who can use AI per day
};

const rateLimitMap = new Map<string, RateLimitEntry>();
const dailyUserLimitMap = new Map<string, DailyLimitEntry>(); // Track daily usage per user
const dailyUniqueUsers = new Set<string>(); // Track unique users today
let dailyResetDate = new Date().toISOString().split('T')[0]; // Current date

/**
 * Get today's date string and reset daily counters if it's a new day
 */
function checkDailyReset(): string {
    const today = new Date().toISOString().split('T')[0];
    if (today !== dailyResetDate) {
        // It's a new day - reset all daily limits
        dailyUserLimitMap.clear();
        dailyUniqueUsers.clear();
        dailyResetDate = today;
        console.log(`[Rate Limit] Daily reset performed for ${today}`);
    }
    return today;
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
    // Also check for daily reset
    checkDailyReset();
}, 5 * 60 * 1000);

interface RateLimitConfig {
    maxRequests: number;  // Max requests per window
    windowMs: number;     // Time window in milliseconds
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number;  // Seconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Result with success status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: Math.ceil(config.windowMs / 1000),
        };
    }

    // Check if under limit
    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            success: true,
            remaining: config.maxRequests - entry.count,
            resetIn: Math.ceil((entry.resetTime - now) / 1000),
        };
    }

    // Rate limited
    return {
        success: false,
        remaining: 0,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    // Check common proxy headers
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }

    // Fallback for local development
    return "127.0.0.1";
}

export interface DailyLimitResult {
    success: boolean;
    reason?: 'user_daily_limit' | 'global_user_limit';
    userRemaining: number;
    uniqueUsersToday: number;
    maxUniqueUsers: number;
}

/**
 * Check daily limits for AI usage
 * @param identifier - Unique identifier (usually IP address)
 * @returns Result with success status and limit information
 */
export function checkDailyLimit(identifier: string): DailyLimitResult {
    checkDailyReset(); // Ensure we're on the right day

    const isExistingUser = dailyUniqueUsers.has(identifier);
    const userEntry = dailyUserLimitMap.get(identifier);

    // Check if this is a new user and we've hit the global limit
    if (!isExistingUser && dailyUniqueUsers.size >= DAILY_CONFIG.maxUniqueUsersPerDay) {
        console.log(`[Rate Limit] Global daily user limit reached (${dailyUniqueUsers.size}/${DAILY_CONFIG.maxUniqueUsersPerDay})`);
        return {
            success: false,
            reason: 'global_user_limit',
            userRemaining: 0,
            uniqueUsersToday: dailyUniqueUsers.size,
            maxUniqueUsers: DAILY_CONFIG.maxUniqueUsersPerDay,
        };
    }

    // Check if existing user has hit their daily limit
    if (userEntry && userEntry.count >= DAILY_CONFIG.maxRequestsPerUserPerDay) {
        console.log(`[Rate Limit] User ${identifier} hit daily limit (${userEntry.count}/${DAILY_CONFIG.maxRequestsPerUserPerDay})`);
        return {
            success: false,
            reason: 'user_daily_limit',
            userRemaining: 0,
            uniqueUsersToday: dailyUniqueUsers.size,
            maxUniqueUsers: DAILY_CONFIG.maxUniqueUsersPerDay,
        };
    }

    // Add user to daily set and increment their count
    dailyUniqueUsers.add(identifier);

    if (userEntry) {
        userEntry.count++;
    } else {
        dailyUserLimitMap.set(identifier, {
            count: 1,
            resetDate: dailyResetDate,
        });
    }

    const currentCount = dailyUserLimitMap.get(identifier)!.count;
    console.log(`[Rate Limit] User ${identifier}: ${currentCount}/${DAILY_CONFIG.maxRequestsPerUserPerDay} daily requests, ${dailyUniqueUsers.size}/${DAILY_CONFIG.maxUniqueUsersPerDay} unique users today`);

    return {
        success: true,
        userRemaining: DAILY_CONFIG.maxRequestsPerUserPerDay - currentCount,
        uniqueUsersToday: dailyUniqueUsers.size,
        maxUniqueUsers: DAILY_CONFIG.maxUniqueUsersPerDay,
    };
}

/**
 * Get current daily limit status (for debugging/monitoring)
 */
export function getDailyLimitStatus(): {
    uniqueUsersToday: number;
    maxUniqueUsers: number;
    resetDate: string;
} {
    checkDailyReset();
    return {
        uniqueUsersToday: dailyUniqueUsers.size,
        maxUniqueUsers: DAILY_CONFIG.maxUniqueUsersPerDay,
        resetDate: dailyResetDate,
    };
}
