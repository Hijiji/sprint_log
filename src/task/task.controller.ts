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
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { TaskIdDto } from './dto/task-id.dto';
import { AssignSprintDto } from './dto/assign-sprint.dto';

@ApiTags('tasks')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({
    summary: '업무 생성',
    description: '새로운 업무를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '업무가 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({
    summary: '업무 목록 조회',
    description:
      '커서 기반 페이지네이션으로 업무 목록을 조회합니다. 스프린트 ID로 필터링 가능합니다.',
  })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    type: String,
    description: '스프린트 ID로 필터링',
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
    description: '업무 목록을 반환합니다.',
  })
  findAll(@Query() findAllTaskDto: FindAllTaskDto) {
    return this.taskService.findAll(findAllTaskDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '업무 상세 조회',
    description:
      '업무의 상세 정보를 조회합니다. 할당된 사용자와 작업 로그를 포함합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무 상세 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  findOne(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.findOne(taskIdDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '업무 정보 수정',
    description: '업무의 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 업무를 찾을 수 없습니다.',
  })
  update(@Param() taskIdDto: TaskIdDto, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(taskIdDto, updateTaskDto);
  }

  @Get(':id/has-work-logs')
  @ApiOperation({
    summary: '업무에 작업일지 존재 여부 확인',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무에 작업일지 존재 여부를 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  hasWorkLogs(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.hasWorkLogs(taskIdDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '업무 삭제',
    description: '업무를 soft delete합니다. 작업 로그는 유지됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  remove(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.remove(taskIdDto, false);
  }

  @Delete(':id/work-logs')
  @ApiOperation({
    summary: '업무 및 작업 로그 삭제',
    description: '업무를 soft delete하고 모든 작업 로그도 함께 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무와 작업 로그가 삭제되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  removeAll(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.remove(taskIdDto, true);
  }

  @Post(':id/assign-sprint')
  @ApiOperation({
    summary: '업무를 스프린트에 할당',
    description: '업무를 스프린트에 할당합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '업무가 성공적으로 스프린트에 할당되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 업무/스프린트를 찾을 수 없습니다.',
  })
  assignSprint(
    @Param() taskIdDto: TaskIdDto,
    @Body() assignSprintDto: AssignSprintDto,
  ) {
    return this.taskService.assignSprint(
      taskIdDto.id,
      assignSprintDto.sprintId,
    );
  }

  @Delete(':id/assign-sprint')
  @ApiOperation({
    summary: '업무에서 스프린트 할당 제거',
    description: '업무에서 스프린트 할당을 제거하고 백로그로 이동합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '업무 ID',
    example: 'task-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트 할당이 제거되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '업무를 찾을 수 없습니다.',
  })
  removeAssignSprint(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.removeAssignSprint(taskIdDto);
  }
}
