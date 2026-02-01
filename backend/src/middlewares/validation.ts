import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/utils/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validation middleware using Zod schemas
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ field: string; message: string }> = [];

      // Validate body
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `body.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      // Validate query
      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `query.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      // Validate params
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `params.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate only request body
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Validate only query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Validate only path parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
