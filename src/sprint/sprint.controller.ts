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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { FindAllSprintDto } from './dto/find-all-sprint.dto';
import { SprintIdDto } from './dto/sprint-id-dto';
import { MemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';

@ApiTags('sprints')
@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  @ApiOperation({
    summary: '스프린트 생성',
    description:
      '새로운 스프린트를 생성합니다. 선택적으로 팀원을 할당할 수 있습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '스프린트가 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터입니다.',
  })
  create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintService.create(createSprintDto);
  }

  @Get()
  @ApiOperation({
    summary: '스프린트 목록 조회',
    description: '오프셋 기반 페이지네이션으로 스프린트 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: '페이지네이션 오프셋 (기본값: 0)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 10)',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트 목록을 반환합니다.',
  })
  findAll(@Query() findAllSprintDto: FindAllSprintDto) {
    return this.sprintService.findAll(findAllSprintDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '스프린트 상세 조회',
    description:
      '스프린트의 상세 정보를 조회합니다. 하위 업무 목록과 팀원 목록을 포함합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트 상세 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  findOne(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.findOne(sprintIdDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '스프린트 정보 수정',
    description:
      '스프린트의 정보를 수정합니다. 상태 변경 시 시작/종료 날짜가 자동으로 설정됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 스프린트를 찾을 수 없습니다.',
  })
  update(
    @Param() sprintIdDto: SprintIdDto,
    @Body() updateSprintDto: UpdateSprintDto,
  ) {
    return this.sprintService.update(sprintIdDto, updateSprintDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '스프린트 삭제',
    description:
      '스프린트를 soft delete합니다. 할당된 업무는 백로그로 이동하지 않습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  remove(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.remove(sprintIdDto, false);
  }

  @Delete(':id/tasks')
  @ApiOperation({
    summary: '스프린트 및 업무 삭제',
    description:
      '스프린트를 soft delete하고 할당된 모든 업무를 백로그로 이동합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트가 삭제되고 업무가 백로그로 이동되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  removeWithTasks(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.remove(sprintIdDto, true);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: '스프린트 시작',
    description:
      '스프린트의 상태를 진행 중으로 변경하고 시작 날짜를 현재 날짜로 설정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트가 시작되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  sprintStart(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.sprintStart(sprintIdDto);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: '스프린트 완료',
    description:
      '스프린트의 상태를 완료로 변경하고 종료 날짜를 현재 날짜로 설정합니다. 미완료 업무는 백로그로 이동합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiResponse({
    status: 200,
    description: '스프린트가 완료되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트를 찾을 수 없습니다.',
  })
  sprintComplete(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.sprintEnd(sprintIdDto);
  }

  @Post(':id/members/:memberId')
  @ApiOperation({
    summary: '스프린트에 팀원 추가',
    description: '스프린트에 새로운 팀원을 할당합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiParam({
    name: 'memberId',
    description: '추가할 팀원 ID',
    example: 'member-001',
  })
  @ApiResponse({
    status: 201,
    description: '팀원이 성공적으로 추가되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '이미 할당된 팀원이거나 존재하지 않는 팀원입니다.',
  })
  addMember(
    @Param() sprintIdDto: SprintIdDto,
    @Param('memberId') memberId: string,
  ) {
    return this.sprintService.addMember(sprintIdDto, memberId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({
    summary: '스프린트에서 팀원 제거',
    description: '스프린트에서 팀원을 제거합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '스프린트 ID',
    example: 'sprint-001',
  })
  @ApiParam({
    name: 'memberId',
    description: '제거할 팀원 ID',
    example: 'member-001',
  })
  @ApiResponse({
    status: 200,
    description: '팀원이 성공적으로 제거되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '스프린트에 할당되지 않은 팀원입니다.',
  })
  removeMember(
    @Param() sprintIdDto: SprintIdDto,
    @Param('memberId') memberId: string,
  ) {
    return this.sprintService.removeMember(sprintIdDto, memberId);
  }
}
