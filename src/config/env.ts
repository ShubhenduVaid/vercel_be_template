import { z } from "zod";

import { ensureEnvironmentLoaded, resolveRuntimeEnvironment, type RuntimeEnvironment } from "./load-environment";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SITE_URL: z.string().url().default("http://localhost:3001"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z.string().default(""),
  DOCS_ENABLED: booleanFromEnv.default(true),
  SERVICE_NAME: z.string().min(1).default("vercel-node-service"),
  SERVICE_VERSION: z.string().min(1).default("0.1.0"),
  COMMIT_SHA: z.string().optional(),
  RATE_LIMIT_ENABLED: booleanFromEnv.default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  AUTH_ENABLED: booleanFromEnv.default(false),
  READINESS_FAIL: booleanFromEnv.default(false),
});

const toOrigins = (value: string): string[] => {
  if (value.trim().length === 0) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export interface AppConfig {
  appEnv: RuntimeEnvironment;
  port: number;
  siteUrl: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  corsOrigins: string[];
  docsEnabled: boolean;
  serviceName: string;
  serviceVersion: string;
  commitSha: string | null;
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  auth: {
    enabled: boolean;
  };
  readiness: {
    forceFail: boolean;
  };
}

export const parseEnv = (env: NodeJS.ProcessEnv): AppConfig => {
  const parsed = envSchema.parse(env);

  return {
    appEnv: resolveRuntimeEnvironment(env),
    port: parsed.PORT,
    siteUrl: parsed.SITE_URL.replace(/\/+$/, ""),
    logLevel: parsed.LOG_LEVEL,
    corsOrigins: toOrigins(parsed.CORS_ORIGINS),
    docsEnabled: parsed.DOCS_ENABLED,
    serviceName: parsed.SERVICE_NAME,
    serviceVersion: parsed.SERVICE_VERSION,
    commitSha: parsed.COMMIT_SHA ?? null,
    rateLimit: {
      enabled: parsed.RATE_LIMIT_ENABLED,
      windowMs: parsed.RATE_LIMIT_WINDOW_MS,
      maxRequests: parsed.RATE_LIMIT_MAX_REQUESTS,
    },
    auth: {
      enabled: parsed.AUTH_ENABLED,
    },
    readiness: {
      forceFail: parsed.READINESS_FAIL,
    },
  };
};

export const loadConfig = (): AppConfig => {
  ensureEnvironmentLoaded();
  return parseEnv(process.env);
};
