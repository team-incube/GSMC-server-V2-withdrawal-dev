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

      if (!student) {
        throw new NotFoundException(`Student with code ${studentCode} not found.`);
      }

      await queryRunner.manager.update(StudentDetailEntity, { studentCode }, { member: null });

      if (student.member) {
        await queryRunner.manager.delete(MemberEntity, student.member.id);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
