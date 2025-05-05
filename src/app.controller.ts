import { Controller, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/api/v2/members')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Delete('/withdraw/:studentCode')
  withdraw(@Param('studentCode', ParseIntPipe) studentCode: number): any {
    return this.appService.withdraw(studentCode);
  }
}
