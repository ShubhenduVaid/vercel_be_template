import { Router } from "express";

import type { AppConfig } from "../../config/env";
import { sendSuccess } from "../../lib/http-response";

import { HealthDataSchema, MetaDataSchema, ReadyDataSchema } from "./schemas";

export const createSystemRouter = (config: AppConfig): Router => {
  const router = Router();

  router.get("/health", (req, res) => {
    sendSuccess(
      req,
      res,
      200,
      {
        status: "ok",
        uptimeSeconds: Number(process.uptime().toFixed(3)),
        timestamp: new Date().toISOString(),
      },
      HealthDataSchema,
    );
  });

  router.get("/ready", (req, res) => {
    const checks = [
      {
        name: "runtime",
        status: "ok" as const,
      },
      {
        name: "forced-readiness-check",
        status: config.readiness.forceFail ? ("fail" as const) : ("ok" as const),
        ...(config.readiness.forceFail
          ? {
              message: "READINESS_FAIL=true",
            }
          : {}),
      },
    ];

    const isReady = checks.every((item) => item.status === "ok");

    sendSuccess(
      req,
      res,
      isReady ? 200 : 503,
      {
        status: isReady ? "ready" : "not_ready",
        checks,
        timestamp: new Date().toISOString(),
      },
      ReadyDataSchema,
    );
  });

  router.get("/meta", (req, res) => {
    sendSuccess(
      req,
      res,
      200,
      {
        service: config.serviceName,
        version: config.serviceVersion,
        environment: config.appEnv,
        commitSha: config.commitSha,
      },
      MetaDataSchema,
    );
  });

  return router;
};
