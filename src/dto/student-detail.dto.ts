import { MemberDto } from './member.dto';
import { Type } from 'class-transformer';

export class studentDetailDto {
  id: number;
  grade: number;
  classNumber: number;
  number: number;
  totalScore: number;
  studentCode: string;
  @Type(() => MemberDto)
  member: MemberDto;
}
