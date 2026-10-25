import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Invalid request.',
      errors: error.flatten(),
    });
    return;
  }

  if (error?.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      message: 'Request body is too large.',
    });
    return;
  }

  console.error('Request failed:', error instanceof Error ? error.name : 'unknown error');
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
};
