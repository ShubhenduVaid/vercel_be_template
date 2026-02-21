import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import type { OpenApiDocument } from "../../contracts/openapi";

interface DocsRouterOptions {
  enabled: boolean;
  document: OpenApiDocument;
}

export const createDocsRouter = (options: DocsRouterOptions): Router => {
  const router = Router();

  if (!options.enabled) {
    return router;
  }

  router.get("/openapi.json", (_req, res) => {
    res.json(options.document);
  });

  router.use("/docs", swaggerUi.serve);
  router.get("/docs", swaggerUi.setup(options.document, { explorer: true }));

  return router;
};
