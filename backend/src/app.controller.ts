import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Payment back is running!',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
