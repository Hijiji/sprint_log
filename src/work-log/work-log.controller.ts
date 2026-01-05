import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { WorkLogService } from './work-log.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkLogIdDto } from './dto/worklog-id.dto';
import { FindAllWorklogDto } from './dto/find-all-worklog.dto';

@ApiTags('work-logs')
@Controller('work-log')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) {}

  @Post()
  @ApiOperation({
    summary: '작업 로그 생성',
    description:
      '사용자가 수행한 작업의 로그를 생성합니다. 업무에 대한 작업 시간과 내용을 기록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '작업 로그가 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 업무/사용자를 찾을 수 없습니다.',
  })
  create(@Body() createWorkLogDto: CreateWorkLogDto) {
    return this.workLogService.create(createWorkLogDto);
  }

  @Get()
  @ApiOperation({
    summary: '작업 로그 목록 조회',
    description:
      '커서 기반 페이지네이션으로 작업 로그 목록을 조회합니다. 업무 또는 사용자로 필터링할 수 있습니다.',
  })
  @ApiQuery({
    name: 'taskId',
    required: false,
    type: String,
    description: '업무 ID로 필터링',
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    type: String,
    description: '사용자 ID로 필터링',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: '페이지네이션 커서',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 10)',
  })
  @ApiResponse({
    status: 200,
    description: '작업 로그 목록을 반환합니다.',
  })
  findAll(@Query() findAllWorklogDto: FindAllWorklogDto) {
    return this.workLogService.findAll(findAllWorklogDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '작업 로그 상세 조회',
    description: '작업 로그의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '작업 로그 ID',
    example: 'worklog-001',
  })
  @ApiResponse({
    status: 200,
    description: '작업 로그 상세 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '작업 로그를 찾을 수 없습니다.',
  })
  findOne(@Param() workLogIdDto: WorkLogIdDto) {
    return this.workLogService.findOne(workLogIdDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '작업 로그 수정',
    description: '작업 로그의 내용과 소요 시간을 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '작업 로그 ID',
    example: 'worklog-001',
  })
  @ApiResponse({
    status: 200,
    description: '작업 로그가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '작업 로그를 찾을 수 없습니다.',
  })
  update(
    @Param() workLogIdDto: WorkLogIdDto,
    @Body() updateWorkLogDto: UpdateWorkLogDto,
  ) {
    return this.workLogService.update(workLogIdDto, updateWorkLogDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '작업 로그 삭제',
    description: '작업 로그를 soft delete합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '작업 로그 ID',
    example: 'worklog-001',
  })
  @ApiResponse({
    status: 200,
    description: '작업 로그가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '작업 로그를 찾을 수 없습니다.',
  })
  remove(@Param() workLogIdDto: WorkLogIdDto) {
    return this.workLogService.remove(workLogIdDto);
  }
}
