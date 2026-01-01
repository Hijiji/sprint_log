import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const { method, url, ip } = request;
    const startedAt = Date.now();

    this.logger.info('HTTP_REQUEST', {
      ip,
      method,
      url,
      body: request?.body,
      query: request?.query,
      params: request?.params,
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startedAt;
        this.logger.info('HTTP_RESPONSE', {
          method,
          url,
          statusCode: response?.statusCode,
          durationMs: duration,
          // 응답 본문은 크기 및 민감도에 따라 필요시 조정
          responseBody: this.serializeForLog(data),
        });
      }),
    );
  }

  /**
   * 응답 객체를 로깅용으로 문자열 2kb를 넘을경우 잘라냄
   */
  private serializeForLog(data: unknown): string {
    try {
      const json = JSON.stringify(data);
      // 2KB 초과 시 앞부분만 남기고 표시
      const limit = 2048;
      return json.length > limit
        ? json.slice(0, limit) + '... (truncated)'
        : json;
    } catch (e) {
      return '[unserializable-response]';
    }
  }
}
