import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StudentDetailEntity } from './entities/student-detail.entity';
import { MemberEntity } from './entities/member.entity';
import { sendDiscordWebhook } from './utils/app.send.discord-webhook.util';

type QueryResult = { affectedRows?: number; rowCount?: number } | unknown[];

function getAffectedRows(result: QueryResult): number {
  if (Array.isArray(result)) return result.length;
  if (typeof result === 'object' && result !== null) {
    const r = result as { affectedRows?: number; rowCount?: number };
    return r.affectedRows ?? r.rowCount ?? 0;
  }
  return 0;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  async withdraw(studentCode: string): Promise<any> {
    this.logger.log(`탈퇴 요청 수신: studentCode=${studentCode}`);

    try {
      return await this.dataSource.transaction(async manager => {
        const studentRepo = manager.getRepository(StudentDetailEntity);
        const memberRepo = manager.getRepository(MemberEntity);

        const student = await studentRepo.findOne({
          where: { studentCode },
          relations: ['member'],
        });

        if (!student || !student.member) {
          this.logger.warn(`탈퇴 실패: studentCode=${studentCode} → 존재하지 않음`);

          await sendDiscordWebhook({
            title: '회원탈퇴 실패',
            description: `❗ 존재하지 않는 학생코드: \`${studentCode}\``,
            color: 0xffff00,
          });

          throw new NotFoundException('아직 회원가입을 하지 않은 학생입니다.');
        }

        const { id: memberId, name, email } = student.member;
        const deletedTables: string[] = [];

        const execute = async (label: string, query: string, values: unknown[]): Promise<void> => {
          const result: unknown = await manager.query(query, values);
          const affected = getAffectedRows(result as QueryResult);
          if (affected > 0) deletedTables.push(label);
        };

        await execute(
          'tb_activity_evidence',
          `DELETE FROM tb_activity_evidence WHERE evidence_id IN (
              SELECT e.evidence_id FROM tb_evidence e
                                          JOIN tb_score s ON e.score_id = s.score_id
              WHERE s.member_id = ?
            )`,
          [memberId],
        );

        await execute(
          'tb_reading_evidence',
          `DELETE FROM tb_reading_evidence WHERE evidence_id IN (
              SELECT e.evidence_id FROM tb_evidence e
                                          JOIN tb_score s ON e.score_id = s.score_id
              WHERE s.member_id = ?
            )`,
          [memberId],
        );

        await execute('tb_certificate', `DELETE FROM tb_certificate WHERE member_id = ?`, [
          memberId,
        ]);

        await execute(
          'tb_other_evidence',
          `DELETE FROM tb_other_evidence WHERE evidence_id IN (
              SELECT e.evidence_id FROM tb_evidence e
                                          JOIN tb_score s ON e.score_id = s.score_id
              WHERE s.member_id = ?
            )`,
          [memberId],
        );

        await execute(
          'tb_evidence',
          `DELETE FROM tb_evidence WHERE score_id IN (
              SELECT score_id FROM tb_score WHERE member_id = ?
            )`,
          [memberId],
        );

        await execute('tb_score', `DELETE FROM tb_score WHERE member_id = ?`, [memberId]);

        await execute(
          'tb_homeroom_teacher_detail',
          `DELETE FROM tb_homeroom_teacher_detail WHERE member_id = ?`,
          [memberId],
        );

        const updateResult = await studentRepo.update({ studentCode }, { member: null });
        if (updateResult.affected && updateResult.affected > 0) {
          deletedTables.push('tb_student_detail (UPDATE)');
        }
        const nullifyResult: unknown = await manager.query(
          `UPDATE tb_student_detail SET member_id = NULL WHERE student_code = ?`,
          [studentCode],
        );
        const nullifyAffected = getAffectedRows(nullifyResult as QueryResult);

        if (nullifyAffected > 0) {
          deletedTables.push('tb_student_detail (member_id NULL)');
        }

        const deleteResult = await memberRepo.delete(memberId);
        if (deleteResult.affected && deleteResult.affected > 0) {
          deletedTables.push('member');
        }

        this.logger.log(`탈퇴 성공: studentCode=${studentCode}`);

        await sendDiscordWebhook({
          title: '✅ 회원탈퇴 성공',
          description: `**studentCode:** \`${studentCode}\`\n**이름:** \`${name}\`\n**이메일:** \`${email}\`\n\n삭제된 테이블:\n${
            deletedTables.length > 0 ? '- ' + deletedTables.join('\n- ') : '※ 삭제된 데이터 없음'
          }`,
          color: 0x00ff00,
        });

        return {
          statusCode: 200,
          message: '회원탈퇴가 완료되었습니다.',
        };
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`탈퇴 중 오류 발생: ${errorMessage}`, errorStack);

      await sendDiscordWebhook({
        title: '❌ 회원탈퇴 중 오류 발생',
        description: `studentCode: \`${studentCode}\`\n에러: \`${errorMessage}\``,
        color: 0xff0000,
      });

      throw new InternalServerErrorException('회원탈퇴 처리 중 오류가 발생했습니다.');
    }
  }
}
