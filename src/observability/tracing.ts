import type pino from "pino";

import type { AppConfig } from "../config/env";

export const initializeTracing = (config: AppConfig, logger: pino.Logger): void => {
  if (process.env.VITEST === "true") {
    return;
  }

  // Placeholder for OpenTelemetry bootstrap.
  logger.debug("Tracing bootstrap placeholder initialized");
};
