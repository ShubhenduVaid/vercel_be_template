import { describe, expect, it } from "vitest";

import { parseEnv } from "../../src/config/env";

describe("parseEnv", () => {
  it("applies defaults for optional values", () => {
    const config = parseEnv({});

    expect(config.appEnv).toBe("local");
    expect(config.port).toBe(3001);
    expect(config.siteUrl).toBe("http://localhost:3001");
    expect(config.docsEnabled).toBe(true);
    expect(config.corsOrigins).toEqual([]);
    expect(config.rateLimit.enabled).toBe(false);
  });

  it("parses and normalizes explicit values", () => {
    const config = parseEnv({
      APP_ENV: "preview",
      PORT: "8080",
      SITE_URL: "https://api.example.com/",
      LOG_LEVEL: "warn",
      CORS_ORIGINS: "https://a.example.com, https://b.example.com",
      DOCS_ENABLED: "false",
      SERVICE_NAME: "starter-service",
      SERVICE_VERSION: "1.2.3",
      COMMIT_SHA: "abc123",
      RATE_LIMIT_ENABLED: "true",
      RATE_LIMIT_WINDOW_MS: "30000",
      RATE_LIMIT_MAX_REQUESTS: "25",
      AUTH_ENABLED: "true",
      READINESS_FAIL: "true",
    });

    expect(config.appEnv).toBe("preview");
    expect(config.port).toBe(8080);
    expect(config.siteUrl).toBe("https://api.example.com");
    expect(config.logLevel).toBe("warn");
    expect(config.corsOrigins).toEqual(["https://a.example.com", "https://b.example.com"]);
    expect(config.docsEnabled).toBe(false);
    expect(config.serviceName).toBe("starter-service");
    expect(config.serviceVersion).toBe("1.2.3");
    expect(config.commitSha).toBe("abc123");
    expect(config.rateLimit).toEqual({
      enabled: true,
      windowMs: 30000,
      maxRequests: 25,
    });
    expect(config.auth.enabled).toBe(true);
    expect(config.readiness.forceFail).toBe(true);
  });
});
