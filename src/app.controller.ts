import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: '헬스 체크',
    description: '애플리케이션의 현재 상태와 설정 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '애플리케이션이 정상적으로 실행 중입니다. 상태, 앱 이름, 환경, 타임스탬프를 포함합니다.',
    schema: {
      example: {
        status: 'ok',
        app: 'sprint-log',
        environment: 'development',
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  getHealth() {
    const appConfig = this.configService.get('app');
    return {
      status: 'ok',
      app: appConfig.name,
      environment: appConfig.env,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    description: 'API 서버의 기본 응답을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '환영 메시지를 반환합니다.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
