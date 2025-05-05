import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppRepository } from './app.repository'; // ✅ 이거
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudentDetailEntity } from './entities/student-detail.entity';
import { MemberEntity } from './entities/member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '3306', 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [StudentDetailEntity, MemberEntity],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([StudentDetailEntity, MemberEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, AppRepository],
})
export class AppModule {}
