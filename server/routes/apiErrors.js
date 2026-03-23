/**
 * Typed HTTP error for async route handlers.
 */
export class HttpError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} [code]
   */
  constructor(statusCode, message, code) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {string} [code]
 */
export function sendError(res, status, message, code) {
  const body = { error: message };
  if (code) body.code = code;
  return res.status(status).json(body);
}
