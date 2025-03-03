import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Requests, RequestsDocument } from './entity/requests.entity';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { RequestsDto } from './dto/requests.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Requests.name) private RequestsModel: Model<RequestsDocument>,
    @Inject('Messages-Service')
    private readonly conversationClient: ClientProxy,
  ) {}

  async verifyToken(token: string): Promise<string> {
    const jwtToken = token.split(' ')[1];
    const decodedToken = jwt.decode(jwtToken) as jwt.JwtPayload;
    const username = decodedToken?.preferred_username;
    if (!username) {
      throw new Error('Invalid token: Username not found.');
    }
    return username;
  }

  async sendRequest(requestsDto: RequestsDto): Promise<RequestsDocument> {
    const sendRequest = new this.RequestsModel(requestsDto);
    return sendRequest.save();
  }

  async getMyRequests(username: string): Promise<RequestsDocument[]> {
    return this.RequestsModel.find({ receiver: username }).exec();
  }

  async acceptRequest(
    requestId: string,
    status: string,
  ): Promise<RequestsDocument> {
    const request = await this.RequestsModel.findByIdAndUpdate(
      requestId,
      { status },
      { new: true },
    ).exec();
    if (!request) {
      throw new NotFoundException('Request Not Found');
    }
      if (status === 'accepted') {
          console.log('Emitting create-conversation event', {
              user1: request.sender,
              user2: request.receiver,
          });
          this.conversationClient.emit('create-conversation', {
              user1: request.sender,
              user2: request.receiver,
          });
      }
      return request;
  }
}
