import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { Logger } from 'winston';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    //다양한 형태의 예외의 메시지 추출
    const message = this.extractMessage(exception);

    this.logger.error('HTTP_EXCEPTION', {
      path: request?.url,
      method: request?.method,
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const responseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message,
    };

    httpAdapter.reply(response, responseBody, status);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') return res;
      if (typeof res === 'object' && res) {
        const maybeMessage = (res as any).message;
        if (Array.isArray(maybeMessage)) return maybeMessage[0];
        if (typeof maybeMessage === 'string') return maybeMessage;
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
