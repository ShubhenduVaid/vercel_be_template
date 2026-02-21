import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

const HEADER_NAME = "x-request-id";

const isValidRequestId = (value: string): boolean => value.length > 0 && value.length <= 128;

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header(HEADER_NAME);
  const requestId = incoming && isValidRequestId(incoming) ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader(HEADER_NAME, requestId);

  next();
};
