import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle AppError instances
  if (err instanceof AppError) {
    logger.warn({
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      url: req.originalUrl,
      method: req.method
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message
    }));

    logger.warn({
      code: 'VALIDATION_ERROR',
      url: req.originalUrl,
      issuesCount: issues.length
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: issues
      }
    });
    return;
  }

  // Handle SyntaxErrors (e.g., malformed JSON in body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload'
      }
    });
    return;
  }

  // Unhandled / Unexpected Errors - NEVER output stack traces or sensitive internals
  logger.error({
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message,
    url: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.'
    }
  });
}
