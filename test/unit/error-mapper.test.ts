import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  AppError,
  InternalAppError,
  mapUnknownError,
  ValidationAppError,
} from "../../src/errors/app-error";

describe("mapUnknownError", () => {
  it("returns existing app errors unchanged", () => {
    const original = new AppError({
      code: "NOT_FOUND",
      statusCode: 404,
      message: "missing",
    });

    const mapped = mapUnknownError(original);

    expect(mapped).toBe(original);
  });

  it("maps zod errors to validation errors", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const parsed = schema.safeParse({
      id: "invalid",
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const mapped = mapUnknownError(parsed.error);
      expect(mapped).toBeInstanceOf(ValidationAppError);
      expect(mapped.code).toBe("VALIDATION_ERROR");
      expect(mapped.statusCode).toBe(400);
    }
  });

  it("maps unknown errors to internal error", () => {
    const mapped = mapUnknownError(new Error("boom"));

    expect(mapped).toBeInstanceOf(InternalAppError);
    expect(mapped.code).toBe("INTERNAL_ERROR");
    expect(mapped.statusCode).toBe(500);
  });
});
