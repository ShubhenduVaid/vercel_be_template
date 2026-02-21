import type { Application } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";

const OpenApiOperationSchema = z.object({
  responses: z.record(z.unknown()),
});

const OpenApiPathItemSchema = z.object({
  get: OpenApiOperationSchema.optional(),
  post: OpenApiOperationSchema.optional(),
  put: OpenApiOperationSchema.optional(),
  patch: OpenApiOperationSchema.optional(),
  delete: OpenApiOperationSchema.optional(),
  options: OpenApiOperationSchema.optional(),
  head: OpenApiOperationSchema.optional(),
});

const OpenApiDocumentSchema = z.object({
  openapi: z.string().min(1),
  paths: z.record(OpenApiPathItemSchema),
});

type OpenApiDocument = z.infer<typeof OpenApiDocumentSchema>;
type HttpMethod = keyof z.infer<typeof OpenApiPathItemSchema>;

const getDocumentedStatuses = (
  document: OpenApiDocument,
  path: string,
  method: HttpMethod,
): number[] => {
  const operation = document.paths[path]?.[method];
  expect(operation).toBeDefined();

  if (!operation) {
    return [];
  }

  return Object.keys(operation.responses)
    .map((statusCode) => Number.parseInt(statusCode, 10))
    .filter((statusCode) => Number.isFinite(statusCode))
    .sort((left, right) => left - right);
};

const createTestApp = (readinessFail: boolean): Application => {
  return createApp({
    config: parseEnv({
      APP_ENV: "local",
      DOCS_ENABLED: "true",
      READINESS_FAIL: readinessFail ? "true" : "false",
    }),
  });
};

describe("openapi contract parity", () => {
  it("documents all public v1 GET endpoints currently exposed by the app", async () => {
    const app = createTestApp(false);
    const response = await request(app).get("/api/v1/openapi.json").expect(200);
    const document = OpenApiDocumentSchema.parse(response.body);

    const expectedGetPaths = [
      "/api/v1/health",
      "/api/v1/ready",
      "/api/v1/meta",
      "/api/v1/openapi.json",
      "/api/v1/docs",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
    ];

    expectedGetPaths.forEach((path) => {
      expect(document.paths[path]?.get).toBeDefined();
    });
  });

  it("keeps documented GET statuses aligned with runtime behavior", async () => {
    const readyApp = createTestApp(false);
    const notReadyApp = createTestApp(true);

    const openApiResponse = await request(readyApp).get("/api/v1/openapi.json").expect(200);
    const document = OpenApiDocumentSchema.parse(openApiResponse.body);

    const expectedDocumentedStatuses: Record<string, number[]> = {
      "/api/v1/health": [200, 500],
      "/api/v1/ready": [200, 500, 503],
      "/api/v1/meta": [200, 500],
      "/api/v1/openapi.json": [200, 500],
      "/api/v1/docs": [301, 500],
      "/robots.txt": [200, 500],
      "/sitemap.xml": [200, 500],
      "/llms.txt": [200, 500],
    };

    Object.entries(expectedDocumentedStatuses).forEach(([path, statuses]) => {
      expect(getDocumentedStatuses(document, path, "get")).toEqual(statuses);
    });

    const runtimeChecks: Array<{ app: Application; path: string; expectedStatus: number }> = [
      { app: readyApp, path: "/api/v1/health", expectedStatus: 200 },
      { app: readyApp, path: "/api/v1/ready", expectedStatus: 200 },
      { app: notReadyApp, path: "/api/v1/ready", expectedStatus: 503 },
      { app: readyApp, path: "/api/v1/meta", expectedStatus: 200 },
      { app: readyApp, path: "/api/v1/openapi.json", expectedStatus: 200 },
      { app: readyApp, path: "/api/v1/docs", expectedStatus: 301 },
      { app: readyApp, path: "/robots.txt", expectedStatus: 200 },
      { app: readyApp, path: "/sitemap.xml", expectedStatus: 200 },
      { app: readyApp, path: "/llms.txt", expectedStatus: 200 },
    ];

    for (const check of runtimeChecks) {
      const response = await request(check.app).get(check.path).expect(check.expectedStatus);
      const documentedStatuses = getDocumentedStatuses(document, check.path, "get");

      expect(documentedStatuses).toContain(response.status);
    }
  });
});
