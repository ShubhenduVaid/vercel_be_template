import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import type { AuthStrategy } from "../../src/modules/auth/types";

describe("createApp auth configuration", () => {
  it("throws when auth is enabled without a strategy", () => {
    const config = parseEnv({
      APP_ENV: "local",
      AUTH_ENABLED: "true",
    });

    expect(() => createApp({ config })).toThrowError(
      "AUTH_ENABLED=true but no auth strategy is configured",
    );
  });

  it("allows app creation when auth is enabled and strategy is provided", () => {
    const config = parseEnv({
      APP_ENV: "local",
      AUTH_ENABLED: "true",
    });
    const authStrategy: AuthStrategy = {
      name: "mock",
      authenticate: vi.fn().mockResolvedValue(null),
    };

    expect(() =>
      createApp({
        config,
        authStrategy,
      }),
    ).not.toThrow();
  });
});
