import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkLogService } from './work-log.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';

@Controller('work-log')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) {}

  @Post()
  create(@Body() createWorkLogDto: CreateWorkLogDto) {
    return this.workLogService.create(createWorkLogDto);
  }

  @Get()
  findAll() {
    return this.workLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workLogService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkLogDto: UpdateWorkLogDto) {
    return this.workLogService.update(+id, updateWorkLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workLogService.remove(+id);
  }
}
