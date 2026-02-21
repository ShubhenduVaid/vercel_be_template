import pino from "pino";

import type { AppConfig } from "../config/env";

export const createLogger = (config: AppConfig): pino.Logger =>
  pino({
    level: config.logLevel,
    base: {
      service: config.serviceName,
      env: config.appEnv,
      version: config.serviceVersion,
      commitSha: config.commitSha,
    },
    formatters: {
      level: (label) => ({
        level: label,
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
