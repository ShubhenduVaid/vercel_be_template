import type { Request } from "express";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimitStore {
  consume(key: string, windowMs: number, maxRequests: number): Promise<RateLimitDecision>;
}

export type RateLimitKeyBuilder = (req: Request) => string;
