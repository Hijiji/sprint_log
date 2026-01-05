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
import { ApiTags } from '@nestjs/swagger';
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
  create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintService.create(createSprintDto);
  }

  @Get()
  findAll(@Query() findAllSprintDto: FindAllSprintDto) {
    return this.sprintService.findAll(findAllSprintDto);
  }

  @Get(':id')
  findOne(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.findOne(sprintIdDto);
  }

  @Patch(':id')
  update(
    @Param() sprintIdDto: SprintIdDto,
    @Body() updateSprintDto: UpdateSprintDto,
  ) {
    return this.sprintService.update(sprintIdDto, updateSprintDto);
  }

  @Delete(':id')
  remove(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.remove(sprintIdDto, false);
  }

  @Delete(':id/tasks')
  removeWithTasks(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.remove(sprintIdDto, true);
  }

  @Post(':id/start')
  sprintStart(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.sprintStart(sprintIdDto);
  }

  @Post(':id/complete')
  sprintComplete(@Param() sprintIdDto: SprintIdDto) {
    return this.sprintService.sprintEnd(sprintIdDto);
  }

  @Post(':id/members')
  addMember(@Param() sprintIdDto: SprintIdDto, @Body() memberDto: MemberDto) {
    return this.sprintService.addMember(sprintIdDto, memberDto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param() sprintIdDto: SprintIdDto,
    @Body() memberDto: MemberDto,
  ) {
    return this.sprintService.removeMember(sprintIdDto, memberDto);
  }
}
