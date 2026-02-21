import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";

const createTestApp = () => {
  return createApp({
    config: parseEnv({
      APP_ENV: "local",
      SITE_URL: "https://api.example.com",
    }),
  });
};

describe("discovery routes", () => {
  it("serves robots.txt with sitemap reference", async () => {
    const app = createTestApp();
    const response = await request(app).get("/robots.txt").expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("User-agent: *");
    expect(response.text).toContain("Sitemap: https://api.example.com/sitemap.xml");
  });

  it("serves sitemap.xml with canonical URLs", async () => {
    const app = createTestApp();
    const response = await request(app).get("/sitemap.xml").expect(200);

    expect(response.headers["content-type"]).toContain("application/xml");
    expect(response.text).toContain("<urlset");
    expect(response.text).toContain("<loc>https://api.example.com/</loc>");
    expect(response.text).toContain("<loc>https://api.example.com/api/v1/docs</loc>");
    expect(response.text).toContain("<loc>https://api.example.com/llms.txt</loc>");
  });

  it("serves llms.txt with machine-readable canonical resources", async () => {
    const app = createTestApp();
    const response = await request(app).get("/llms.txt").expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("# vercel-node-service");
    expect(response.text).toContain("API Docs: https://api.example.com/api/v1/docs");
    expect(response.text).toContain("OpenAPI: https://api.example.com/api/v1/openapi.json");
  });
});
