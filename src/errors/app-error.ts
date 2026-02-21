import { ZodError } from "zod";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(params: {
    code: AppErrorCode;
    statusCode: number;
    message: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      code: "VALIDATION_ERROR",
      statusCode: 400,
      message,
      details,
    });
  }
}

export class UnauthorizedAppError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message,
      details,
    });
  }
}

export class ForbiddenAppError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super({
      code: "FORBIDDEN",
      statusCode: 403,
      message,
      details,
    });
  }
}

export class NotFoundAppError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super({
      code: "NOT_FOUND",
      statusCode: 404,
      message,
      details,
    });
  }
}

export class RateLimitedAppError extends AppError {
  constructor(message = "Rate limit exceeded", details?: unknown) {
    super({
      code: "RATE_LIMITED",
      statusCode: 429,
      message,
      details,
    });
  }
}

export class ServiceUnavailableAppError extends AppError {
  constructor(message = "Service unavailable", details?: unknown) {
    super({
      code: "SERVICE_UNAVAILABLE",
      statusCode: 503,
      message,
      details,
    });
  }
}

export class InternalAppError extends AppError {
  constructor(message = "Internal server error", details?: unknown) {
    super({
      code: "INTERNAL_ERROR",
      statusCode: 500,
      message,
      details,
    });
  }
}

const isEntityParseFailedError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    status?: number;
    type?: string;
    message?: string;
  };

  return candidate.status === 400 && candidate.type === "entity.parse.failed";
};

export const mapUnknownError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationAppError("Request validation failed", error.flatten());
  }

  if (isEntityParseFailedError(error)) {
    return new ValidationAppError("Malformed JSON body");
  }

  return new InternalAppError();
};
