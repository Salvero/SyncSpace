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

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
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
