import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ensureEnvironmentLoaded,
  resetEnvironmentLoaderForTests,
  resolveRuntimeEnvironment,
} from "../../src/config/load-environment";

const ORIGINAL_ENV = process.env;

describe("resolveRuntimeEnvironment", () => {
  it("uses APP_ENV when provided", () => {
    expect(resolveRuntimeEnvironment({ APP_ENV: "local" })).toBe("local");
    expect(resolveRuntimeEnvironment({ APP_ENV: "preview" })).toBe("preview");
    expect(resolveRuntimeEnvironment({ APP_ENV: "production" })).toBe("production");
  });

  it("falls back to VERCEL_ENV when APP_ENV is missing", () => {
    expect(resolveRuntimeEnvironment({ VERCEL_ENV: "development" })).toBe("local");
    expect(resolveRuntimeEnvironment({ VERCEL_ENV: "preview" })).toBe("preview");
    expect(resolveRuntimeEnvironment({ VERCEL_ENV: "production" })).toBe("production");
  });

  it("does not infer app environment from NODE_ENV", () => {
    expect(resolveRuntimeEnvironment({ NODE_ENV: "production" })).toBe("local");
    expect(resolveRuntimeEnvironment({ NODE_ENV: "development" })).toBe("local");
  });

  it("defaults to local when no environment hints are available", () => {
    expect(resolveRuntimeEnvironment({})).toBe("local");
  });
});

describe("ensureEnvironmentLoaded", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetEnvironmentLoaderForTests();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    resetEnvironmentLoaderForTests();
  });

  it("loads target file selected by APP_ENV in .env and allows target overrides", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-loader-"));

    try {
      fs.writeFileSync(
        path.join(tempDir, ".env"),
        "APP_ENV=preview\nPORT=3001\nSERVICE_VERSION=0.1.0-base\n",
      );
      fs.writeFileSync(path.join(tempDir, ".env.preview"), "PORT=3100\nSERVICE_VERSION=0.2.0-preview\n");

      delete process.env.APP_ENV;
      delete process.env.VERCEL_ENV;
      delete process.env.PORT;
      delete process.env.SERVICE_VERSION;

      ensureEnvironmentLoaded(tempDir);

      expect(process.env.APP_ENV).toBe("preview");
      expect(process.env.PORT).toBe("3100");
      expect(process.env.SERVICE_VERSION).toBe("0.2.0-preview");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("never overrides runtime environment variables", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-loader-"));

    try {
      fs.writeFileSync(path.join(tempDir, ".env"), "APP_ENV=production\nPORT=3001\n");
      fs.writeFileSync(path.join(tempDir, ".env.production"), "PORT=3200\n");

      process.env.APP_ENV = "production";
      process.env.PORT = "3333";

      ensureEnvironmentLoaded(tempDir);

      expect(process.env.PORT).toBe("3333");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
