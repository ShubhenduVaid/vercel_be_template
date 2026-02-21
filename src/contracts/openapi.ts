import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import type { AppConfig } from "../config/env";
import { ErrorResponseSchema } from "../contracts/schemas";
import {
  HealthResponseSchema,
  MetaResponseSchema,
  ReadyResponseSchema,
} from "../modules/system/schemas";

export type OpenApiDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export const createOpenApiDocument = (config: AppConfig): OpenApiDocument => {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: "get",
    path: "/api/v1/health",
    tags: ["System"],
    summary: "Liveness probe",
    responses: {
      200: {
        description: "Service is alive",
        content: {
          "application/json": {
            schema: HealthResponseSchema,
          },
        },
      },
      500: {
        description: "Internal error",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/ready",
    tags: ["System"],
    summary: "Readiness probe",
    responses: {
      200: {
        description: "Service is ready",
        content: {
          "application/json": {
            schema: ReadyResponseSchema,
          },
        },
      },
      503: {
        description: "Service is not ready",
        content: {
          "application/json": {
            schema: ReadyResponseSchema,
          },
        },
      },
      500: {
        description: "Internal error",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/meta",
    tags: ["System"],
    summary: "Runtime metadata",
    responses: {
      200: {
        description: "Service metadata",
        content: {
          "application/json": {
            schema: MetaResponseSchema,
          },
        },
      },
      500: {
        description: "Internal error",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/openapi.json",
    tags: ["Documentation"],
    summary: "OpenAPI specification document",
    responses: {
      200: {
        description: "OpenAPI specification",
        content: {
          "application/json": {
            schema: z.record(z.unknown()),
          },
        },
      },
      500: {
        description: "Internal error",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/docs",
    tags: ["Documentation"],
    summary: "Swagger UI documentation",
    responses: {
      301: {
        description: "Redirects to the Swagger UI page at /api/v1/docs/",
      },
      500: {
        description: "Internal error",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: `${config.serviceName} API`,
      version: config.serviceVersion,
      description: "Generic backend starter API with production-ready platform modules.",
    },
    servers: [{ url: "/" }],
    tags: [
      {
        name: "System",
        description: "Operational and metadata endpoints",
      },
      {
        name: "Documentation",
        description: "API contract and interactive documentation endpoints",
      },
    ],
  });
};
