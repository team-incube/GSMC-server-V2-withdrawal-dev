import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { MemberRole } from '../domain/constant/member-role.enum';

@Entity('tb_member')
export class MemberEntity {
  @PrimaryGeneratedColumn({ name: 'member_id' })
  id: number;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'email', nullable: false })
  email: string;

  @Column({ name: 'password', nullable: false })
  password: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: Object.values(MemberRole),
    enumName: 'member_role_enum',
    nullable: false,
  })
  role: MemberRole;
}
