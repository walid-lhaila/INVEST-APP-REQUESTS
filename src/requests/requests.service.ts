import { Injectable } from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Requests, RequestsDocument} from "./entity/requests.entity";
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import {RequestsDto} from "./dto/requests.dto";

@Injectable()
export class RequestsService {
    constructor(
        @InjectModel(Requests.name) private RequestsModel: Model<RequestsDocument>,
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
        return this.RequestsModel.find({receiver :username}).exec();
    }

}
