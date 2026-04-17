import { PartialType } from '@nestjs/mapped-types';
import { CreateBayseDto } from './create-bayse.dto';

export class UpdateBayseDto extends PartialType(CreateBayseDto) {}
