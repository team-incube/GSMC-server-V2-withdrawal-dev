import { Injectable } from '@nestjs/common';
import { AppRepository } from './app.repository';

@Injectable()
export class AppService {
  constructor(private readonly appRepository: AppRepository) {}

  async withdraw(studentCode: string): Promise<any> {
    if (await this.appRepository.existsByStudentCode(studentCode)) {
      return this.appRepository.removeMemberAssociationByStudentCode(studentCode);
    }
  }
}
