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
import { ApiTags } from '@nestjs/swagger';
import { WorkLogIdDto } from './dto/worklog-id.dto';
import { FindAllWorklogDto } from './dto/find-all-worklog.dto';

@ApiTags('work-logs')
@Controller('work-log')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) {}

  @Post()
  create(@Body() createWorkLogDto: CreateWorkLogDto) {
    return this.workLogService.create(createWorkLogDto);
  }

  @Get()
  findAll(@Query() findAllWorklogDto: FindAllWorklogDto) {
    return this.workLogService.findAll(findAllWorklogDto);
  }

  @Get(':id')
  findOne(@Param() workLogIdDto: WorkLogIdDto) {
    return this.workLogService.findOne(workLogIdDto);
  }

  @Patch(':id')
  update(
    @Param() workLogIdDto: WorkLogIdDto,
    @Body() updateWorkLogDto: UpdateWorkLogDto,
  ) {
    return this.workLogService.update(workLogIdDto, updateWorkLogDto);
  }

  @Delete(':id')
  remove(@Param() workLogIdDto: WorkLogIdDto) {
    return this.workLogService.remove(workLogIdDto);
  }
}
