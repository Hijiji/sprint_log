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
import { ApiTags } from '@nestjs/swagger';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { TaskIdDto } from './dto/task-id.dto';
import { AssignSprintDto } from './dto/assign-sprint.dto';

@ApiTags('task')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  findAll(@Query() findAllTaskDto: FindAllTaskDto) {
    return this.taskService.findAll(findAllTaskDto);
  }

  @Get(':id')
  findOne(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.findOne(taskIdDto);
  }

  @Patch(':id')
  update(@Param() taskIdDto: TaskIdDto, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(taskIdDto, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.remove(taskIdDto, false);
  }

  @Delete(':id/work-logs')
  removeAll(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.remove(taskIdDto, true);
  }

  @Post(':id/assign-sprint')
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
  removeAssignSprint(@Param() taskIdDto: TaskIdDto) {
    return this.taskService.removeAssignSprint(taskIdDto);
  }
}
