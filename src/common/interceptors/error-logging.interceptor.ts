import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, query, params } = request;

        this.logger.error(
          `Request failed: ${method} ${url}`,
          error.stack,
          "ErrorLoggingInterceptor"
        );

        this.logger.debug(
          `Request details: ${JSON.stringify({
            body,
            query,
            params,
          })}`,
          "ErrorLoggingInterceptor"
        );

        return throwError(() => error);
      })
    );
  }
}
