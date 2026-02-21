import { z } from "zod";

import { createSuccessResponseSchema } from "../../contracts/schemas";

export const HealthDataSchema = z.object({
  status: z.literal("ok"),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

export const ReadyCheckSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["ok", "fail"]),
  message: z.string().min(1).optional(),
});

export const ReadyDataSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.array(ReadyCheckSchema),
  timestamp: z.string().datetime(),
});

export const MetaDataSchema = z.object({
  service: z.string().min(1),
  version: z.string().min(1),
  environment: z.enum(["local", "preview", "production"]),
  commitSha: z.string().nullable(),
});

export const HealthResponseSchema = createSuccessResponseSchema(HealthDataSchema);
export const ReadyResponseSchema = createSuccessResponseSchema(ReadyDataSchema);
export const MetaResponseSchema = createSuccessResponseSchema(MetaDataSchema);
