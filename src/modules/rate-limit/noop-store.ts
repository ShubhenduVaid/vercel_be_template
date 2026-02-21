import type { RateLimitStore } from "./types";

export const createNoopRateLimitStore = (): RateLimitStore => ({
  consume: (_key, _windowMs, maxRequests) =>
    Promise.resolve({
      allowed: true,
      remaining: maxRequests,
    }),
});
