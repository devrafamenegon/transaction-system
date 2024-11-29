import { HttpException, HttpStatus } from "@nestjs/common";

export interface ErrorResponse {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
}

export class BaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code: string = "INTERNAL_SERVER_ERROR",
    public readonly details?: Record<string, any>
  ) {
    super(
      {
        statusCode: status,
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      status
    );
  }

  getErrorResponse(path?: string): ErrorResponse {
    const response = this.getResponse() as Record<string, any>;

    const errorResponse: ErrorResponse = {
      statusCode: response.statusCode,
      message: response.message,
      code: response.code,
      timestamp: response.timestamp,
      path,
    };

    if (response.details) {
      errorResponse.details = response.details;
    }

    return errorResponse;
  }
}
