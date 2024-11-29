import { Injectable, LogLevel, ConsoleLogger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor(private configService: ConfigService) {
    super();
    this.setLogLevels(
      this.parseLogLevels(configService.get("logging.level", "debug"))
    );
  }

  private parseLogLevels(level: string): LogLevel[] {
    const levels: LogLevel[] = ["error", "warn", "log", "debug", "verbose"];
    const index = levels.indexOf(level as LogLevel);
    return index >= 0 ? levels.slice(0, index + 1) : ["error", "warn", "log"];
  }

  error(message: string, trace?: string, context?: string): void {
    super.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    super.warn(message, context);
  }

  log(message: string, context?: string): void {
    super.log(message, context);
  }

  debug(message: string, context?: string): void {
    super.debug(message, context);
  }

  verbose(message: string, context?: string): void {
    super.verbose(message, context);
  }

  logTransaction(transactionId: string, status: string, details: any): void {
    this.log(
      `Transaction ${transactionId}: ${status}\nDetails: ${JSON.stringify(details, null, 2)}`,
      "TransactionLog"
    );
  }

  logAccountActivity(accountId: string, action: string, details: any): void {
    this.debug(
      `Account ${accountId}: ${action}\nDetails: ${JSON.stringify(details, null, 2)}`,
      "AccountActivity"
    );
  }

  logAuthActivity(userId: string, action: string, success: boolean): void {
    const level = success ? "debug" : "warn";
    const message = `Auth ${action} - User: ${userId} - Status: ${success ? "Success" : "Failed"}`;
    this[level](message, "Authentication");
  }
}
