import { Router } from "express";

import type { AppConfig } from "../../config/env";

const toAbsoluteUrl = (siteUrl: string, pathname: string): string => {
  return `${siteUrl}${pathname}`;
};

const xmlEscape = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const sitemapPaths = ["/", "/api/v1/docs", "/api/v1/openapi.json", "/api/v1/meta", "/llms.txt"];

export const createDiscoveryRouter = (config: AppConfig): Router => {
  const router = Router();

  router.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(
      [
        "User-agent: *",
        "Allow: /",
        `Sitemap: ${toAbsoluteUrl(config.siteUrl, "/sitemap.xml")}`,
      ].join("\n"),
    );
  });

  router.get("/sitemap.xml", (_req, res) => {
    const entries = sitemapPaths
      .map((path) => {
        return [
          "<url>",
          `  <loc>${xmlEscape(toAbsoluteUrl(config.siteUrl, path))}</loc>`,
          "  <changefreq>weekly</changefreq>",
          "  <priority>0.8</priority>",
          "</url>",
        ].join("\n");
      })
      .join("\n");

    const document = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      entries,
      "</urlset>",
    ].join("\n");

    res.type("application/xml");
    res.send(document);
  });

  router.get("/llms.txt", (_req, res) => {
    const content = [
      `# ${config.serviceName}`,
      "",
      `Version: ${config.serviceVersion}`,
      `Site: ${config.siteUrl}`,
      "",
      "## Canonical resources",
      `- API Docs: ${toAbsoluteUrl(config.siteUrl, "/api/v1/docs")}`,
      `- OpenAPI: ${toAbsoluteUrl(config.siteUrl, "/api/v1/openapi.json")}`,
      `- Metadata: ${toAbsoluteUrl(config.siteUrl, "/api/v1/meta")}`,
      "",
      "## Summary",
      "Reusable Vercel Node.js backend template with production-ready API platform modules.",
    ].join("\n");

    res.type("text/plain");
    res.send(content);
  });

  return router;
};
