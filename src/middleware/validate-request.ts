import type { RequestHandler } from "express";
import type { AnyZodObject } from "zod";

interface ValidationSchema {
  params?: AnyZodObject;
  query?: AnyZodObject;
  body?: AnyZodObject;
}

export const validateRequest = (schema: ValidationSchema): RequestHandler => {
  return (req, _res, next) => {
    try {
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
