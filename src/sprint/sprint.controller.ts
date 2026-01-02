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
  findOne(@Param('id') sprintIdDto: SprintIdDto) {
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
    return this.sprintService.remove(sprintIdDto);
  }
}
