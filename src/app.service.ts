import { AppRepository } from './app.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly appRepository: AppRepository) {}

  async withdraw(studentCode: string): Promise<any> {
    const exists = await this.appRepository.existsByStudentCode(studentCode);
    if (!exists) {
      throw new NotFoundException('아직 회원가입을 하지 않은 학생입니다.');
    }
    await this.appRepository.removeMemberAssociationByStudentCode(studentCode);
    return {
      statusCode: 200,
      message: '회원탈퇴가 완료되었습니다.',
    };
  }
}
