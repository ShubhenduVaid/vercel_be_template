import type { RequestHandler } from "express";

import { ServiceUnavailableAppError, UnauthorizedAppError } from "../../errors/app-error";

import type { AuthStrategy } from "./types";

export const createAuthContextMiddleware = (strategy?: AuthStrategy): RequestHandler => {
  return (req, _res, next) => {
    if (!strategy) {
      req.principal = null;
      next();
      return;
    }

    void (async () => {
      try {
        req.principal = await strategy.authenticate(req);
        next();
      } catch (error) {
        next(error);
      }
    })();
  };
};

export const requireAuth = (): RequestHandler => {
  return (req, _res, next) => {
    if (!req.principal) {
      next(new UnauthorizedAppError());
      return;
    }

    next();
  };
};

export const ensureAuthConfigured = (strategy?: AuthStrategy): RequestHandler => {
  return (_req, _res, next) => {
    if (!strategy) {
      next(new ServiceUnavailableAppError("Auth is enabled but no strategy is configured"));
      return;
    }

    next();
  };
};
