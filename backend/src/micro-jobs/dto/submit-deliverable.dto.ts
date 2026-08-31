import { IsString } from 'class-validator';

export class SubmitDeliverableDto {
  @IsString()
  note!: string;

  @IsString()
  link!: string;
}
