import type { Request, Response } from "express";
import type { z } from "zod";

import { createSuccessResponseSchema } from "../contracts/schemas";

export const sendSuccess = <T extends z.ZodTypeAny>(
  req: Request,
  res: Response,
  statusCode: number,
  data: z.infer<T>,
  dataSchema: T,
): void => {
  const payload = createSuccessResponseSchema(dataSchema).parse({
    data,
    requestId: req.requestId,
  });

  res.status(statusCode).json(payload);
};
