import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

/**
 * Unified error payload returned for every unhandled exception.
 *
 * The shape is stable across validation errors, expected HTTP errors and
 * unexpected failures so the frontend can rely on a single contract.
 */
interface ErrorResponseBody {
  /** HTTP status code, mirrored in the response status line. */
  statusCode: number;
  /** Short, machine-friendly reason phrase (e.g. `Bad Request`). */
  error: string;
  /** Human-readable summary safe to surface to the client. */
  message: string;
  /** Structured validation issues, present only for validation failures. */
  details?: unknown;
  /** Request path that produced the error. */
  path: string;
  /** ISO 8601 timestamp of when the error was handled. */
  timestamp: string;
  /** Correlation id echoed in logs to trace a single request end-to-end. */
  requestId: string;
}

/** Normalized exception data extracted from an arbitrary thrown value. */
interface NormalizedException {
  status: number;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Catch-all exception filter producing a single, stable error format.
 *
 * Handles three cases: Zod validation failures (from the global
 * `ZodValidationPipe`), regular `HttpException`s, and any other thrown value
 * (treated as an unexpected 500). Every caught error is logged once with a
 * correlation id — `WARN` for client (4xx) errors, `ERROR` with a stack trace
 * for server (5xx) errors — so nothing fails silently.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Convert the caught exception into the unified error response and send it.
   *
   * Side effects: writes a structured log line and the HTTP response.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    const requestId = this.resolveRequestId(request);
    const { status, error, message, details } = this.normalize(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      ...(details !== undefined ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
    };

    const logLine = `[ExceptionFilter] ${status} ${request.method} ${request.url} ${message} requestId=${requestId}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        logLine,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(logLine);
    }

    response.status(status).json(body);
  }

  /** Reuse an inbound `x-request-id`, otherwise mint a fresh correlation id. */
  private resolveRequestId(request: Request): string {
    const inboundRequestId = request.headers['x-request-id'];
    if (typeof inboundRequestId === 'string' && inboundRequestId.length > 0) {
      return inboundRequestId;
    }
    return randomUUID();
  }

  /**
   * Reduce any thrown value to a status, reason phrase, message and optional
   * validation details.
   */
  private normalize(exception: unknown): NormalizedException {
    if (exception instanceof ZodValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Validation failed',
        details: exception.getZodError().issues,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const rawResponse = exception.getResponse();
      return {
        status,
        error: this.extractError(rawResponse, status),
        message: this.extractMessage(rawResponse, exception.message),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };
  }

  /** Pull the reason phrase from an HttpException response body. */
  private extractError(rawResponse: string | object, status: number): string {
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      const candidate = (rawResponse as { error?: unknown }).error;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }
    return this.reasonPhrase(status);
  }

  /** Pull the human-readable message from an HttpException response body. */
  private extractMessage(rawResponse: string | object, fallback: string): string {
    if (typeof rawResponse === 'string') {
      return rawResponse;
    }
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      const candidate = (rawResponse as { message?: unknown }).message;
      if (typeof candidate === 'string') {
        return candidate;
      }
      if (Array.isArray(candidate)) {
        return candidate.join(', ');
      }
    }
    return fallback;
  }

  /** Map a status code to its canonical reason phrase, defaulting to Error. */
  private reasonPhrase(status: number): string {
    const phrase = HttpStatus[status];
    if (typeof phrase !== 'string') {
      return 'Error';
    }
    return phrase
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
