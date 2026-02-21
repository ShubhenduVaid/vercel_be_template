import request from "supertest";
import { describe, expect, it } from "vitest";

import handler from "../../api/index";
import { HealthResponseSchema } from "../../src/modules/system/schemas";

describe("vercel handler smoke", () => {
  it("serves health endpoint through api entrypoint", async () => {
    const response = await request(handler).get("/api/v1/health").expect(200);
    const body = HealthResponseSchema.parse(response.body);

    expect(body.data.status).toBe("ok");
  });
});
