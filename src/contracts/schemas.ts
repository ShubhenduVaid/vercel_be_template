import { z } from "zod";

export const RequestIdSchema = z.string().min(1);

export const ErrorBodySchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
});

export const ErrorResponseSchema = z.object({
  error: ErrorBodySchema,
  requestId: RequestIdSchema,
});

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    requestId: RequestIdSchema,
  });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
