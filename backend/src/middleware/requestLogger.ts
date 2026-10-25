import type { RequestHandler } from 'express';

/** Logs request metadata only; never logs headers, query values, or request bodies. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.info(`${req.method} ${req.path} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });
  next();
};
