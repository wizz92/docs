import { randomUUID } from 'crypto';

/**
 * Sets `req.id` and echoes `X-Request-Id` (accept client id or generate).
 */
export function requestIdMiddleware(req, res, next) {
  const id = req.get('X-Request-Id')?.trim() || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
