export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'FORBIDDEN_WORKSPACE'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMITED'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'MALFORMED_DATA'
  | 'ML_SERVICE_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static unprocessable(message: string, details?: unknown): AppError {
    return new AppError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static internal(message = 'An unexpected internal error occurred'): AppError {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}
