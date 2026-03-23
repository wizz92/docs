import { HttpError } from './apiErrors.js';

/** Log server-side failures; includes `req.id` when present. */
export function logRouteError(err, req) {
  const id = req?.id ? String(req.id) : '—';
  console.error(`[req ${id}]`, err);
}

/**
 * Wrap an async Express handler. `HttpError` becomes JSON with status + optional `code`.
 * @param {(req: import('express').Request, res: import('express').Response) => Promise<void>} fn
 */
export function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logRouteError(err, req);
      if (res.headersSent) return;
      if (err instanceof HttpError) {
        const body = { error: err.message };
        if (err.code) body.code = err.code;
        return res.status(err.statusCode).json(body);
      }
      res.status(500).json({
        error: err.message || 'Internal server error',
        code: 'internal_error',
      });
    });
  };
}

export { HttpError };
