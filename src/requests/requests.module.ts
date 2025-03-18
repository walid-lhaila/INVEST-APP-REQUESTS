import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Requests, RequestsSchema } from './entity/requests.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Requests.name, schema: RequestsSchema },
    ]),
    ClientsModule.register([
      {
        name: 'Messages-Service',
        transport: Transport.TCP,
        options: {
          host: 'messages',
          port: 3004,
        },
      },
      {
        name: 'Audit-Service',
        transport: Transport.TCP,
        options: {
          host: 'audit',
          port: 3005,
        },
      },
    ]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
