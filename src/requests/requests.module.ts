import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Requests, RequestsSchema } from './entity/requests.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Requests.name, schema: RequestsSchema },
    ]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
