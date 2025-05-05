import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppRepository } from './app.repository';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly appRepository: AppRepository) {}

  async withdraw(studentCode: string): Promise<any> {
    this.logger.log(`탈퇴 요청 수신: studentCode=${studentCode}`);

    const exists = await this.appRepository.existsByStudentCode(studentCode);
    if (!exists) {
      this.logger.warn(`탈퇴 요청 실패: 존재하지 않는 studentCode=${studentCode}`);
      throw new NotFoundException('아직 회원가입을 하지 않은 학생입니다.');
    }

    await this.appRepository.removeMemberAssociationByStudentCode(studentCode);
    this.logger.log(`탈퇴 성공: studentCode=${studentCode}`);

    return {
      statusCode: 200,
      message: '회원탈퇴가 완료되었습니다.',
    };
  }
}
