import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { ServiceUnavailableAppError, UnauthorizedAppError } from "../../src/errors/app-error";
import {
  createAuthContextMiddleware,
  ensureAuthConfigured,
  requireAuth,
} from "../../src/modules/auth/middleware";
import type { AuthPrincipal, AuthStrategy } from "../../src/modules/auth/types";

const flushAsync = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

describe("auth middleware", () => {
  it("sets anonymous principal when no strategy is provided", () => {
    const middleware = createAuthContextMiddleware();
    const next: NextFunction = vi.fn();
    const req = { principal: undefined } as unknown as Request;
    const res = {} as Response;

    middleware(req, res, next);

    expect(req.principal).toBeNull();
    expect(next).toHaveBeenCalledWith();
  });

  it("hydrates principal when strategy authenticates successfully", async () => {
    const principal: AuthPrincipal = {
      subject: "user-123",
      scopes: ["read:items"],
      provider: "test",
    };
    const authenticate = vi.fn().mockResolvedValue(principal);
    const strategy: AuthStrategy = {
      name: "mock",
      authenticate,
    };
    const middleware = createAuthContextMiddleware(strategy);
    const next: NextFunction = vi.fn();
    const req = { principal: undefined } as unknown as Request;
    const res = {} as Response;

    middleware(req, res, next);
    await flushAsync();

    expect(authenticate).toHaveBeenCalledWith(req);
    expect(req.principal).toEqual(principal);
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards authentication errors", async () => {
    const error = new Error("auth failed");
    const authenticate = vi.fn().mockRejectedValue(error);
    const strategy: AuthStrategy = {
      name: "mock",
      authenticate,
    };
    const middleware = createAuthContextMiddleware(strategy);
    const next: NextFunction = vi.fn();
    const req = { principal: undefined } as unknown as Request;
    const res = {} as Response;

    middleware(req, res, next);
    await flushAsync();

    expect(next).toHaveBeenCalledWith(error);
  });

  it("rejects anonymous request when route requires auth", () => {
    const middleware = requireAuth();
    const next: NextFunction = vi.fn();
    const req = { principal: null } as unknown as Request;
    const res = {} as Response;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedAppError));
  });

  it("allows request when principal exists", () => {
    const middleware = requireAuth();
    const next: NextFunction = vi.fn();
    const req = {
      principal: {
        subject: "user-123",
        scopes: [],
        provider: "test",
      },
    } as unknown as Request;
    const res = {} as Response;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("returns service unavailable when auth strategy is missing", () => {
    const middleware = ensureAuthConfigured();
    const next: NextFunction = vi.fn();
    const req = {} as Request;
    const res = {} as Response;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableAppError));
  });

  it("passes when auth strategy is configured", () => {
    const strategy: AuthStrategy = {
      name: "mock",
      authenticate: vi.fn().mockResolvedValue(null),
    };
    const middleware = ensureAuthConfigured(strategy);
    const next: NextFunction = vi.fn();
    const req = {} as Request;
    const res = {} as Response;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
