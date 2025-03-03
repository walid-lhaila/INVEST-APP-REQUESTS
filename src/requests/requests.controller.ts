import { Controller, UnauthorizedException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @MessagePattern({ cmd: 'sendRequests' })
  async sendRequests(@Payload() data: any) {
    const { token, payload } = data;
    if (!token) {
      throw new UnauthorizedException('TOKEN IS MISSING');
    }
    const sender = await this.requestsService.verifyToken(token);
    const requestData = {
      ...payload,
      sender,
    };
    return this.requestsService.sendRequest(requestData);
  }

  @MessagePattern({ cmd: 'getMyRequests' })
    async getMyRequests(@Payload() data: any) {
      const {token} = data;
      if(!token) {
          throw new UnauthorizedException('TOKEN IS MISSING');
      }
      const username = await this.requestsService.verifyToken(token);
      return this.requestsService.getMyRequests(username);
  }
}
