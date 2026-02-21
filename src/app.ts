import compression from "compression";
import cors, { type CorsOptions } from "cors";
import express, { type Application, type Request } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import type { AppConfig } from "./config/env";
import { loadConfig } from "./config/env";
import { createOpenApiDocument } from "./contracts/openapi";
import { createLogger } from "./lib/logger";
import { createErrorHandler } from "./middleware/error-handler";
import { notFoundMiddleware } from "./middleware/not-found";
import { requestIdMiddleware } from "./middleware/request-id";
import { createAuthContextMiddleware } from "./modules/auth/middleware";
import type { AuthStrategy } from "./modules/auth/types";
import { createDocsRouter } from "./modules/docs/routes";
import { createRateLimitMiddleware } from "./modules/rate-limit/middleware";
import { createNoopRateLimitStore } from "./modules/rate-limit/noop-store";
import type { RateLimitStore } from "./modules/rate-limit/types";
import { createSystemRouter } from "./modules/system/routes";
import { initializeTracing } from "./observability/tracing";

export interface CreateAppOptions {
  config?: AppConfig;
  rateLimitStore?: RateLimitStore;
  authStrategy?: AuthStrategy;
}

const buildCorsOptions = (config: AppConfig): CorsOptions => ({
  origin: config.corsOrigins.length === 0 ? true : config.corsOrigins,
  credentials: false,
});

export const createApp = (options: CreateAppOptions = {}): Application => {
  const config = options.config ?? loadConfig();
  const logger = createLogger(config);
  const authStrategy = options.authStrategy;

  initializeTracing(config, logger);

  const app = express();
  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => {
        const request = req as Request;
        return request.requestId;
      },
      customProps: (req) => {
        const request = req as Request;
        return {
          requestId: request.requestId,
        };
      },
      customSuccessMessage: () => "request_completed",
      customErrorMessage: () => "request_failed",
    }),
  );

  app.use(helmet());
  app.use(cors(buildCorsOptions(config)));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  const rateLimitStore = options.rateLimitStore ?? createNoopRateLimitStore();

  app.use(
    createRateLimitMiddleware({
      enabled: config.rateLimit.enabled,
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
      store: rateLimitStore,
    }),
  );

  if (config.auth.enabled) {
    if (!authStrategy) {
      throw new Error("AUTH_ENABLED=true but no auth strategy is configured");
    }

    app.use(createAuthContextMiddleware(authStrategy));
  } else {
    app.use(createAuthContextMiddleware());
  }

  const v1Router = express.Router();
  v1Router.use(createSystemRouter(config));
  v1Router.use(
    createDocsRouter({
      enabled: config.docsEnabled,
      document: createOpenApiDocument(config),
    }),
  );

  app.use("/api/v1", v1Router);

  app.get("/", (req, res) => {
    res.status(200).json({
      data: {
        service: config.serviceName,
        status: "ok",
        docs: "/api/v1/docs",
        openapi: "/api/v1/openapi.json",
      },
      requestId: req.requestId,
    });
  });

  app.get(["/favicon.ico", "/favicon.svg", "/favicon.png"], (_req, res) => {
    res.setHeader("cache-control", "public, max-age=86400, immutable");
    res.status(204).end();
  });

  app.get("/api/docs", (_req, res) => {
    res.redirect(307, "/api/v1/docs");
  });

  app.get("/api/openapi.json", (_req, res) => {
    res.redirect(307, "/api/v1/openapi.json");
  });

  app.use(notFoundMiddleware);
  app.use(
    createErrorHandler({
      logger,
      exposeStack: config.appEnv !== "production",
    }),
  );

  return app;
};

const app = createApp();

export default app;
