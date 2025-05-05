import { Controller, Delete, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/api/v2/members')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Delete('/withdraw/:studentCode')
  withdraw(@Param('studentCode') studentCode: string): any {
    return this.appService.withdraw(studentCode);
  }
}
