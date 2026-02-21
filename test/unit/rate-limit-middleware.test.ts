import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { RateLimitedAppError } from "../../src/errors/app-error";
import { createRateLimitMiddleware } from "../../src/modules/rate-limit/middleware";
import type { RateLimitStore } from "../../src/modules/rate-limit/types";

const flushAsync = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

const createResponse = (): { res: Response; setHeader: ReturnType<typeof vi.fn> } => {
  const setHeader = vi.fn();
  return {
    res: {
      setHeader,
    } as unknown as Response,
    setHeader,
  };
};

describe("rate limit middleware", () => {
  it("passes through when rate limiting is disabled", () => {
    const consume = vi.fn();
    const store: RateLimitStore = {
      consume,
    };
    const middleware = createRateLimitMiddleware({
      enabled: false,
      windowMs: 60_000,
      maxRequests: 10,
      store,
    });
    const next: NextFunction = vi.fn();
    const req = { ip: "1.2.3.4" } as Request;
    const { res } = createResponse();

    middleware(req, res, next);

    expect(consume).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("sets rate limit headers and allows request when under limit", async () => {
    const consume = vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 7,
    });
    const store: RateLimitStore = {
      consume,
    };
    const middleware = createRateLimitMiddleware({
      enabled: true,
      windowMs: 60_000,
      maxRequests: 10,
      store,
    });
    const next: NextFunction = vi.fn();
    const req = { ip: "1.2.3.4" } as Request;
    const { res, setHeader } = createResponse();

    middleware(req, res, next);
    await flushAsync();

    expect(consume).toHaveBeenCalledWith("1.2.3.4", 60_000, 10);
    expect(setHeader).toHaveBeenCalledWith("x-ratelimit-limit", "10");
    expect(setHeader).toHaveBeenCalledWith("x-ratelimit-remaining", "7");
    expect(next).toHaveBeenCalledWith();
  });

  it("returns rate-limited error and retry-after when over limit", async () => {
    const consume = vi.fn().mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 25,
    });
    const store: RateLimitStore = {
      consume,
    };
    const middleware = createRateLimitMiddleware({
      enabled: true,
      windowMs: 60_000,
      maxRequests: 10,
      store,
    });
    const next: NextFunction = vi.fn();
    const req = { ip: "1.2.3.4" } as Request;
    const { res, setHeader } = createResponse();

    middleware(req, res, next);
    await flushAsync();

    expect(setHeader).toHaveBeenCalledWith("retry-after", "25");
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(RateLimitedAppError));
  });

  it("forwards store errors", async () => {
    const storeError = new Error("store failed");
    const consume = vi.fn().mockRejectedValue(storeError);
    const store: RateLimitStore = {
      consume,
    };
    const middleware = createRateLimitMiddleware({
      enabled: true,
      windowMs: 60_000,
      maxRequests: 10,
      store,
    });
    const next: NextFunction = vi.fn();
    const req = { ip: "1.2.3.4" } as Request;
    const { res } = createResponse();

    middleware(req, res, next);
    await flushAsync();

    expect(next).toHaveBeenCalledWith(storeError);
  });
});
