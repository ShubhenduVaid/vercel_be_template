import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { ErrorResponseSchema } from "../../src/contracts/schemas";
import {
  HealthResponseSchema,
  MetaResponseSchema,
  ReadyResponseSchema,
} from "../../src/modules/system/schemas";

const RootResponseSchema = z.object({
  data: z.object({
    service: z.string().min(1),
    status: z.literal("ok"),
    docs: z.literal("/api/v1/docs"),
    openapi: z.literal("/api/v1/openapi.json"),
    discovery: z.object({
      robots: z.literal("/robots.txt"),
      sitemap: z.literal("/sitemap.xml"),
      llms: z.literal("/llms.txt"),
    }),
  }),
  requestId: z.string().min(1),
});

describe("system routes", () => {
  it("returns 200 on root path with service info", async () => {
    const app = createApp({
      config: parseEnv({ APP_ENV: "local" }),
    });

    const response = await request(app).get("/").expect(200);
    const body = RootResponseSchema.parse(response.body);

    expect(body.data.status).toBe("ok");
    expect(body.data.docs).toBe("/api/v1/docs");
    expect(body.data.openapi).toBe("/api/v1/openapi.json");
    expect(body.data.discovery.sitemap).toBe("/sitemap.xml");
  });

  it("returns health response envelope", async () => {
    const app = createApp({
      config: parseEnv({ APP_ENV: "local" }),
    });

    const response = await request(app).get("/api/v1/health").expect(200);
    const body = HealthResponseSchema.parse(response.body);

    expect(body.data.status).toBe("ok");
    expect(typeof body.data.uptimeSeconds).toBe("number");
    expect(typeof body.requestId).toBe("string");
  });

  it("returns 204 for favicon requests to reduce log noise", async () => {
    const app = createApp({
      config: parseEnv({ APP_ENV: "local" }),
    });

    await request(app).get("/favicon.ico").expect(204);
    await request(app).get("/favicon.svg").expect(204);
    await request(app).get("/favicon.png").expect(204);
  });

  it("returns 200 when service is ready", async () => {
    const app = createApp({
      config: parseEnv({
        APP_ENV: "local",
        READINESS_FAIL: "false",
      }),
    });

    const response = await request(app).get("/api/v1/ready").expect(200);
    const body = ReadyResponseSchema.parse(response.body);

    expect(body.data.status).toBe("ready");
  });

  it("returns 503 when forced readiness check fails", async () => {
    const app = createApp({
      config: parseEnv({
        APP_ENV: "local",
        READINESS_FAIL: "true",
      }),
    });

    const response = await request(app).get("/api/v1/ready").expect(503);
    const body = ReadyResponseSchema.parse(response.body);

    expect(body.data.status).toBe("not_ready");
    expect(body.data.checks[1]?.status).toBe("fail");
  });

  it("returns standardized 404 payload for unknown routes", async () => {
    const app = createApp({
      config: parseEnv({ APP_ENV: "local" }),
    });

    const response = await request(app).get("/api/v1/unknown").expect(404);
    const body = ErrorResponseSchema.parse(response.body);

    expect(body.error.code).toBe("NOT_FOUND");
    expect(typeof body.requestId).toBe("string");
  });

  it("returns app environment in meta", async () => {
    const app = createApp({
      config: parseEnv({
        APP_ENV: "preview",
      }),
    });

    const response = await request(app).get("/api/v1/meta").expect(200);
    const body = MetaResponseSchema.parse(response.body);

    expect(body.data.environment).toBe("preview");
  });

  it("returns standardized 400 payload for malformed json", async () => {
    const app = createApp({
      config: parseEnv({ APP_ENV: "local" }),
    });

    const response = await request(app)
      .post("/api/v1/health")
      .set("content-type", "application/json")
      .send('{"invalidJson":')
      .expect(400);
    const body = ErrorResponseSchema.parse(response.body);

    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
