import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code?: string,
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
}
