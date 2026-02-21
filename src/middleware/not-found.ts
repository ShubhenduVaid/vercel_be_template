import type { RequestHandler } from "express";

import { NotFoundAppError } from "../errors/app-error";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new NotFoundAppError(`Route ${req.method} ${req.originalUrl} was not found`));
};
