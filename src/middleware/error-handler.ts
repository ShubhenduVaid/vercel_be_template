import type { ErrorRequestHandler } from "express";
import type pino from "pino";

import { ErrorResponseSchema } from "../contracts/schemas";
import { mapUnknownError } from "../errors/app-error";

interface ErrorHandlerOptions {
  logger: pino.Logger;
  exposeStack: boolean;
}

export const createErrorHandler = (options: ErrorHandlerOptions): ErrorRequestHandler => {
  return (error, req, res, _next) => {
    void _next;

    const appError = mapUnknownError(error);

    options.logger.error(
      {
        code: appError.code,
        details: appError.details,
        requestId: req.requestId,
        path: req.originalUrl,
        method: req.method,
        error,
      },
      "request_failed",
    );

    const details =
      appError.details ??
      (options.exposeStack && error instanceof Error
        ? {
            stack: error.stack,
          }
        : undefined);

    const payload = ErrorResponseSchema.parse({
      error: {
        code: appError.code,
        message: appError.message,
        ...(details !== undefined ? { details } : {}),
      },
      requestId: req.requestId,
    });

    res.status(appError.statusCode).json(payload);
  };
};
