import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  withdraw(studentCode: number): any {
    studentCode = studentCode + 1;
    return {
      code: 200,
      message: 'Withdrawal successful',
      data: studentCode,
    };
  }
}
