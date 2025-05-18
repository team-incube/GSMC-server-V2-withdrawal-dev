import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StudentDetailEntity } from './entities/student-detail.entity';
import { MemberEntity } from './entities/member.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  async withdraw(studentCode: string): Promise<any> {
    this.logger.log(`탈퇴 요청 수신: studentCode=${studentCode}`);

    return await this.dataSource.transaction(async manager => {
      const studentRepo = manager.getRepository(StudentDetailEntity);
      const memberRepo = manager.getRepository(MemberEntity);

      const student = await studentRepo.findOne({
        where: { studentCode },
        relations: ['member'],
      });

      if (!student || !student.member) {
        this.logger.warn(`탈퇴 실패: studentCode=${studentCode}에 해당하는 학생 또는 멤버 없음`);
        throw new NotFoundException('아직 회원가입을 하지 않은 학생입니다.');
      }

      const memberId = student.member.id;

      // 쿼리들 실행 (최적화하고 싶으면 repository 쿼리로 추출 가능)
      await manager.query(
        `
        DELETE FROM tb_activity_evidence WHERE evidence_id IN (
          SELECT e.evidence_id FROM tb_evidence e
          JOIN tb_score s ON e.score_id = s.score_id
          WHERE s.member_id = ?
        )
      `,
        [memberId],
      );

      await manager.query(
        `
        DELETE FROM tb_reading_evidence WHERE evidence_id IN (
          SELECT e.evidence_id FROM tb_evidence e
          JOIN tb_score s ON e.score_id = s.score_id
          WHERE s.member_id = ?
        )
      `,
        [memberId],
      );

      await manager.query(`DELETE FROM tb_certificate WHERE member_id = ?`, [memberId]);

      await manager.query(
        `
        DELETE FROM tb_other_evidence WHERE evidence_id IN (
          SELECT e.evidence_id FROM tb_evidence e
          JOIN tb_score s ON e.score_id = s.score_id
          WHERE s.member_id = ?
        )
      `,
        [memberId],
      );

      await manager.query(
        `
        DELETE FROM tb_evidence WHERE score_id IN (
          SELECT score_id FROM tb_score WHERE member_id = ?
        )
      `,
        [memberId],
      );

      await manager.query(`DELETE FROM tb_score WHERE member_id = ?`, [memberId]);

      await manager.query(`DELETE FROM tb_homeroom_teacher_detail WHERE member_id = ?`, [memberId]);

      await studentRepo.update({ studentCode }, { member: null });

      await manager.query(`UPDATE tb_student_detail SET member_id = NULL WHERE student_code = ?`, [
        studentCode,
      ]);

      await memberRepo.delete(memberId);

      this.logger.log(`탈퇴 성공: studentCode=${studentCode}`);

      return {
        statusCode: 200,
        message: '회원탈퇴가 완료되었습니다.',
      };
    });
  }
}
