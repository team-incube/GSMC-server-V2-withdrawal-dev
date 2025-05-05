import { MemberRole } from './constant/member-role.enum';

export class MemberDto {
  id: number;
  name: string;
  email: string;
  role: MemberRole;
}
