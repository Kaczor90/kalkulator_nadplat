import { Module, Global } from '@nestjs/common';
import { DatabaseLogger } from './database.logger';

@Global()
@Module({
  providers: [DatabaseLogger],
  exports: [DatabaseLogger],
})
export class DatabaseModule {} 