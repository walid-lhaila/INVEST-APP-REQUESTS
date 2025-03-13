import { Test, type TestingModule } from "@nestjs/testing"
import { RequestsService } from "../requests.service"
import type { Model } from "mongoose"
import { Requests, type RequestsDocument } from "../entity/requests.entity"
import { getModelToken } from "@nestjs/mongoose"
import type { RequestsDto } from "../dto/requests.dto"
import type { ClientProxy } from "@nestjs/microservices"

describe("RequestsService", () => {
    let service: RequestsService
    let model: Model<RequestsDocument>
    let conversationClient: ClientProxy
    let auditClient: ClientProxy

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RequestsService,
                {
                    provide: getModelToken(Requests.name),
                    useValue: {
                        create: jest.fn(),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                        findByIdAndDelete: jest.fn(),
                        findById: jest.fn(),
                    },
                },
                {
                    provide: "Messages-Service",
                    useValue: {
                        emit: jest.fn(),
                    },
                },
                {
                    provide: "Audit-Service",
                    useValue: {
                        emit: jest.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<RequestsService>(RequestsService)
        model = module.get<Model<RequestsDocument>>(getModelToken(Requests.name))
        conversationClient = module.get<ClientProxy>("Messages-Service")
        auditClient = module.get<ClientProxy>("Audit-Service")
    })

    it("should be defined", () => {
        expect(service).toBeDefined()
    })

    describe("sendRequest", () => {
        it("should send a request successfully", async () => {
            const requestsDto: RequestsDto = {
                sender: "user1",
                receiver: "user2",
                status: "pending",
            }

            const mockRequest = {
                ...requestsDto,
                _id: "1",
            }

            // Make sure findOne returns null (no existing request)
            jest.spyOn(model, "findOne").mockResolvedValue(null)
            jest.spyOn(model, "create").mockResolvedValue(mockRequest as any)

            const result = await service.sendRequest(requestsDto)
            expect(result).toEqual(mockRequest)
            expect(model.findOne).toHaveBeenCalledWith({
                sender: requestsDto.sender,
                receiver: requestsDto.receiver,
                status: "pending",
            })
            expect(model.create).toHaveBeenCalledWith(requestsDto)
        })

        it("should throw an error if a pending request already exists", async () => {
            const requestsDto: RequestsDto = {
                sender: "user1",
                receiver: "user2",
                status: "pending",
            }

            const existingRequest = {
                sender: "user1",
                receiver: "user2",
                status: "pending",
            }

            jest.spyOn(model, "findOne").mockResolvedValue(existingRequest as any)

            await expect(service.sendRequest(requestsDto)).rejects.toThrow("Request Already Exists And Is Pending.")
        })
    })

    describe("getMyRequests", () => {
        it("should return pending requests for a receiver", async () => {
            const username = "user2"
            const mockRequests = [
                { sender: "user1", receiver: "user2", status: "pending" },
                { sender: "user3", receiver: "user2", status: "pending" },
            ]

            // Return the array directly, not an object with exec
            jest.spyOn(model, "find").mockResolvedValue(mockRequests as any)

            const result = await service.getMyRequests(username)
            expect(result).toEqual(mockRequests)
            expect(model.find).toHaveBeenCalledWith({
                receiver: username,
                status: "pending",
            })
        })

        it("should return an empty array if no pending requests exist", async () => {
            const username = "user2"

            // Return empty array directly, not an object with exec
            jest.spyOn(model, "find").mockResolvedValue([] as any)

            const result = await service.getMyRequests(username)
            expect(result).toEqual([])
            expect(model.find).toHaveBeenCalledWith({
                receiver: username,
                status: "pending",
            })
        })
    })


    describe("acceptRequest", () => {
        it("should update request status and emit event when accepted", async () => {
            const requestId = "1"
            const status = "accepted"
            const updatedRequest = {
                _id: requestId,
                sender: "user1",
                receiver: "user2",
                status: "accepted",
            }

            jest.spyOn(model, "findByIdAndUpdate").mockResolvedValue(updatedRequest as any)
            jest.spyOn(conversationClient, "emit")

            const result = await service.acceptRequest(requestId, status)
            expect(result).toEqual(updatedRequest)
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith(requestId, { status }, { new: true })
            expect(conversationClient.emit).toHaveBeenCalledWith("create-conversation", {
                user1: "user1",
                user2: "user2",
            })
        })

        it("should throw NotFoundException if request not found", async () => {
            const requestId = "1"
            const status = "accepted"

            jest.spyOn(model, "findByIdAndUpdate").mockResolvedValue(null)

            await expect(service.acceptRequest(requestId, status)).rejects.toThrow("Request Not Found")
        })
    })


    describe("rejectRequest", () => {
        it("should delete request and emit audit event", async () => {
            const requestId = "1"
            const request = {
                _id: requestId,
                sender: "user1",
                receiver: "user2",
                status: "pending",
            }

            jest.spyOn(model, "findById").mockResolvedValue(request as any)
            jest.spyOn(model, "findByIdAndDelete").mockResolvedValue({} as any)
            jest.spyOn(auditClient, "emit")

            await service.rejectRequest(requestId)

            expect(model.findById).toHaveBeenCalledWith(requestId)
            expect(model.findByIdAndDelete).toHaveBeenCalledWith(requestId)
            expect(auditClient.emit).toHaveBeenCalledWith(
                "audit-log",
                expect.objectContaining({
                    requestId,
                    rejectedBy: "user2",
                }),
            )
        })

        it("should throw NotFoundException if request not found", async () => {
            const requestId = "1"

            jest.spyOn(model, "findById").mockResolvedValue(null)

            await expect(service.rejectRequest(requestId)).rejects.toThrow("Request Not Found")
        })
    })
})

