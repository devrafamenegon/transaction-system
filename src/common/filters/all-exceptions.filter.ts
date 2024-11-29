import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { LoggerService } from "../logger/logger.service";
import { BaseException, ErrorResponse } from "../exceptions/base.exception";
import {
  DatabaseException,
  ForeignKeyException,
  UniqueConstraintException,
} from "../exceptions/database.exception";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
      path,
    };

    // Handle different types of exceptions
    if (exception instanceof BaseException) {
      errorResponse = exception.getErrorResponse(path);
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      errorResponse = {
        statusCode: status,
        message: exceptionResponse.message || exception.message,
        code: exceptionResponse.code || `HTTP_${status}`,
        details: exceptionResponse.details,
        timestamp: new Date().toISOString(),
        path,
      };
    } else if (exception instanceof QueryFailedError) {
      // Handle database-specific errors
      const dbException = this.handleDatabaseError(exception);
      errorResponse = dbException.getErrorResponse(path);
    }

    // Log the error with context
    this.logger.error(
      `[${errorResponse.code}] ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : undefined,
      "ExceptionFilter"
    );

    // Log additional details if available
    if (errorResponse.details) {
      this.logger.debug(
        `Error Details: ${JSON.stringify(errorResponse.details)}`,
        "ExceptionFilter"
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private handleDatabaseError(error: QueryFailedError): DatabaseException {
    // PostgreSQL error codes
    const errorCode = (error as any).code;

    switch (errorCode) {
      case "23505": // unique_violation
        return new UniqueConstraintException(
          this.extractConstraintField(error.message),
          this.extractConstraintValue(error.message)
        );
      case "23503": // foreign_key_violation
        return new ForeignKeyException(
          this.extractConstraintField(error.message),
          this.extractConstraintValue(error.message)
        );
      default:
        return new DatabaseException(
          "Database operation failed",
          "DATABASE_ERROR",
          { originalError: error.message }
        );
    }
  }

  private extractConstraintField(message: string): string {
    // Extract field name from error message
    const match = message.match(/column "([^"]+)"/);
    return match ? match[1] : "unknown";
  }

  private extractConstraintValue(message: string): string {
    // Extract value from error message
    const match = message.match(/value "([^"]+)"/);
    return match ? match[1] : "unknown";
  }
}
