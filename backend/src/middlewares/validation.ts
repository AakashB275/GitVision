import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Generic validation middleware using Zod schemas
 * Validates request body, query parameters, or path parameters
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      (req as any).validatedBody = validatedData;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors || error.message,
      });
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      (req as any).validatedQuery = validatedData;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Query validation error',
        details: error.errors || error.message,
      });
    }
  };
}

/**
 * Validate path parameters
 */
export function validateParams(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync(req.params);
      (req as any).validatedParams = validatedData;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Params validation error',
        details: error.errors || error.message,
      });
    }
  };
}
