import type { RequestHandler } from "express";

import { RateLimitedAppError } from "../../errors/app-error";

import type { RateLimitKeyBuilder, RateLimitStore } from "./types";

interface RateLimitMiddlewareOptions {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  store: RateLimitStore;
  keyBuilder?: RateLimitKeyBuilder;
}

const defaultKeyBuilder: RateLimitKeyBuilder = (req) => req.ip || "anonymous";

export const createRateLimitMiddleware = (options: RateLimitMiddlewareOptions): RequestHandler => {
  const keyBuilder = options.keyBuilder ?? defaultKeyBuilder;

  return (req, res, next) => {
    if (!options.enabled) {
      next();
      return;
    }

    void (async () => {
      try {
        const key = keyBuilder(req);
        const decision = await options.store.consume(key, options.windowMs, options.maxRequests);

        res.setHeader("x-ratelimit-limit", String(options.maxRequests));
        res.setHeader("x-ratelimit-remaining", String(Math.max(0, decision.remaining)));

        if (!decision.allowed) {
          if (typeof decision.retryAfterSeconds === "number") {
            res.setHeader("retry-after", String(decision.retryAfterSeconds));
          }

          next(
            new RateLimitedAppError("Rate limit exceeded", {
              retryAfterSeconds: decision.retryAfterSeconds,
            }),
          );
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    })();
  };
};
