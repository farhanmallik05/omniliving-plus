import { randomUUID } from 'crypto';
import { DatabaseService } from './database.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  source?: string;
  method?: string;
  sessionId?: string;
  [key: string]: any;
}

export class Logger {
  private static defaultContext: LogContext = { source: 'OmniLiving+' };
  private context: LogContext;
  private db: DatabaseService;

  constructor(context: LogContext = {}) {
    this.context = { ...Logger.defaultContext, ...context };
    this.db = DatabaseService.getInstance();
  }

  public child(subContext: LogContext): Logger {
    return new Logger({ ...this.context, ...subContext });
  }

  public static generateTraceId(): string {
    return randomUUID().replace(/-/g, '');
  }

  public static generateSpanId(): string {
    return randomUUID().replace(/-/g, '').substring(0, 16);
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const traceId = this.context.traceId || Logger.generateTraceId();
    const spanId = this.context.spanId || Logger.generateSpanId();

    const record = {
      timestamp,
      level,
      message,
      traceId,
      spanId,
      source: this.context.source || 'system',
      method: this.context.method,
      sessionId: this.context.sessionId,
      ...(meta ? { meta } : {})
    };

    // Console output formatted as structured JSON for log aggregators (Pino/Datadog/CloudWatch)
    const jsonStr = JSON.stringify(record);
    if (level === 'ERROR') {
      console.error(jsonStr);
    } else if (level === 'WARN') {
      console.warn(jsonStr);
    } else {
      console.log(jsonStr);
    }

    // Persist into SQLite for audit trail
    try {
      this.db.insertEvent({
        timestamp,
        source: this.context.source || 'system',
        message: `${level !== 'INFO' ? `[${level}] ` : ''}${message}`,
        level,
        trace_id: traceId,
        data_json: meta ? JSON.stringify(meta) : undefined
      });
    } catch {
      // Ignore database insert failure in logger to prevent recursive crash
    }
  }

  public debug(message: string, meta?: any) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      this.log('DEBUG', message, meta);
    }
  }

  public info(message: string, meta?: any) {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.log('WARN', message, meta);
  }

  public error(message: string, meta?: any) {
    this.log('ERROR', message, meta);
  }
}

export const rootLogger = new Logger({ source: 'MCP Server' });
