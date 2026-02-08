import { PartialType } from '@nestjs/swagger';
import { CreateCaseNoteDto } from './create-case-note.dto';

export class UpdateCaseNoteDto extends PartialType(CreateCaseNoteDto) {}