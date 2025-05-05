import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('tb_student_detail')
export class StudentDetailEntity {
  @PrimaryGeneratedColumn({ name: 'student_detail_id' })
  id: number;

  @OneToOne(() => MemberEntity, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: MemberEntity | null;

  @Column({ name: 'grade', nullable: false })
  grade: number;

  @Column({ name: 'class_number', nullable: false })
  classNumber: number;

  @Column({ name: 'number', nullable: false })
  number: number;

  @Column({ name: 'total_score', nullable: false })
  totalScore: number;

  @Column({ name: 'student_code', unique: true, nullable: false })
  studentCode: string;
}
