import { createApp } from "./app";
import { loadConfig } from "./config/env";
import { createLogger } from "./lib/logger";

const config = loadConfig();
const logger = createLogger(config);
const app = createApp({ config });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "server_started");
});

const gracefulShutdown = (signal: string): void => {
  logger.info({ signal }, "shutdown_started");

  server.close((error) => {
    if (error) {
      logger.error({ error }, "shutdown_failed");
      process.exitCode = 1;
      return;
    }

    logger.info("shutdown_completed");
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  logger.error({ error }, "unhandled_rejection");
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "uncaught_exception");
});
