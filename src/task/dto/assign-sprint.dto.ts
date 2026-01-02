import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSprintDto {
  @IsNotEmpty()
  @IsString()
  sprintId: string;
}
