import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StudentDetailEntity } from './entities/student-detail.entity';
import { MemberEntity } from './entities/member.entity';

@Injectable()
export class AppRepository extends Repository<StudentDetailEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentDetailEntity, dataSource.createEntityManager());
  }

  async existsByStudentCode(studentCode: string): Promise<boolean> {
    return await this.createQueryBuilder('student')
      .where('student.student_code = :studentCode', { studentCode })
      .getExists();
  }

  async removeMemberAssociationByStudentCode(studentCode: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const student = await queryRunner.manager.findOne(StudentDetailEntity, {
        where: { studentCode },
        relations: ['member'],
      });

      if (!student || !student.member) {
        throw new NotFoundException(`Student or Member not found for code ${studentCode}`);
      }

      const memberId = student.member.id;
      await queryRunner.query(
        `DELETE FROM tb_activity_evidence WHERE evidence_id IN (
        SELECT e.evidence_id FROM tb_evidence e
        JOIN tb_score s ON e.score_id = s.score_id
        WHERE s.member_id = ?
      )`,
        [memberId],
      );

      await queryRunner.query(
        `DELETE FROM tb_reading_evidence WHERE evidence_id IN (
        SELECT e.evidence_id FROM tb_evidence e
        JOIN tb_score s ON e.score_id = s.score_id
        WHERE s.member_id = ?
      )`,
        [memberId],
      );

      await queryRunner.query(`DELETE FROM tb_certificate WHERE member_id = ?`, [memberId]);

      await queryRunner.query(
        `DELETE FROM tb_other_evidence WHERE evidence_id IN (
          SELECT e.evidence_id FROM tb_evidence e
          JOIN tb_score s ON e.score_id = s.score_id
          WHERE s.member_id = ?
        )`,
        [memberId],
      );

      await queryRunner.query(
        `DELETE FROM tb_evidence WHERE score_id IN (
            SELECT score_id FROM tb_score WHERE member_id = ?
          )`,
        [memberId],
      );

      await queryRunner.query(`DELETE FROM tb_score WHERE member_id = ?`, [memberId]);

      await queryRunner.query(`DELETE FROM tb_homeroom_teacher_detail WHERE member_id = ?`, [
        memberId,
      ]);

      await queryRunner.manager.update(StudentDetailEntity, { studentCode }, { member: null });
      await queryRunner.query(
        `UPDATE tb_student_detail SET member_id = NULL WHERE student_code = ?`,
        [studentCode],
      );

      await queryRunner.manager.delete(MemberEntity, memberId);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
