import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err?.message ?? err);

  const status  = err?.status  ?? 500;
  const message = err?.message ?? 'Internal server error';
  const code    = err?.code    ?? 'INTERNAL_ERROR';

  res.status(status).json({ error: message, code });
}