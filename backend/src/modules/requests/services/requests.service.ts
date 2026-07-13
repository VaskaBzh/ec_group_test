import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRequestInput,
  ListRequestsQuery,
  PaginatedResult,
  PurchaseRequestDto,
} from '@ec-group/contracts';
import { RequestsRepository } from '../repositories/requests.repository';
import { PurchaseRequestModel } from '../models/purchase-request.model';
import { InvalidStatusTransitionError } from '../models/request-status.error';
import { toPurchaseRequestDto } from '../mappers/purchase-request.mapper';

/**
 * Orchestrates purchase-request use cases: creation, listing and review.
 *
 * Holds no persistence details of its own — it delegates data access to
 * {@link RequestsRepository} and status rules to {@link PurchaseRequestModel},
 * then maps rows to the public {@link PurchaseRequestDto} contract.
 */
@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(private readonly requestsRepository: RequestsRepository) {}

  /**
   * Create a purchase request on behalf of a requester.
   *
   * @param authorId - Id of the authenticated requester.
   * @param input - Validated request payload.
   * @returns The created request as a public DTO.
   */
  async create(
    authorId: string,
    input: CreateRequestInput,
  ): Promise<PurchaseRequestDto> {
    this.logger.debug(
      `[RequestsService.create] authorId=${authorId} title=${input.title}`,
    );

    const created = await this.requestsRepository.create({
      title: input.title,
      quantity: input.quantity,
      amount: input.amount,
      comment: input.comment,
      authorId,
    });

    this.logger.log(
      `[RequestsService.create] created id=${created.id} authorId=${authorId}`,
    );
    return toPurchaseRequestDto(created);
  }

  /**
   * List purchase requests for a reviewer with sorting and pagination.
   *
   * @param query - Fully-resolved sort and pagination parameters.
   * @returns A page of requests plus pagination metadata.
   */
  async list(
    query: ListRequestsQuery,
  ): Promise<PaginatedResult<PurchaseRequestDto>> {
    this.logger.debug(
      `[RequestsService.list] sort=${query.sortField}:${query.sortDirection} page=${query.page} size=${query.pageSize}`,
    );

    const [items, total] = await Promise.all([
      this.requestsRepository.findMany({
        sortField: query.sortField,
        sortDirection: query.sortDirection,
        page: query.page,
        pageSize: query.pageSize,
      }),
      this.requestsRepository.count(),
    ]);

    this.logger.debug(
      `[RequestsService.list] returned=${items.length} total=${total}`,
    );

    return {
      items: items.map(toPurchaseRequestDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /**
   * Approve a pending request.
   *
   * @param id - Request id.
   * @returns The updated request as a public DTO.
   * @throws {NotFoundException} When the request does not exist.
   * @throws {ConflictException} When the request is not `Pending`.
   */
  async approve(id: string): Promise<PurchaseRequestDto> {
    return this.transition(id, (model) => model.approve());
  }

  /**
   * Reject a pending request.
   *
   * @param id - Request id.
   * @returns The updated request as a public DTO.
   * @throws {NotFoundException} When the request does not exist.
   * @throws {ConflictException} When the request is not `Pending`.
   */
  async reject(id: string): Promise<PurchaseRequestDto> {
    return this.transition(id, (model) => model.reject());
  }

  /**
   * Load a request, apply a domain status transition and persist the result.
   *
   * Domain invariant violations from the model are translated into a
   * `409 Conflict` so the HTTP layer stays free of lifecycle rules.
   */
  private async transition(
    id: string,
    applyTransition: (model: PurchaseRequestModel) => void,
  ): Promise<PurchaseRequestDto> {
    this.logger.debug(`[RequestsService.transition] id=${id}`);

    const existing = await this.requestsRepository.findById(id);
    if (!existing) {
      this.logger.warn(`[RequestsService.transition] not found id=${id}`);
      throw new NotFoundException('Purchase request not found');
    }

    const model = PurchaseRequestModel.fromPersistence(existing.id, existing.status);
    const previousStatus = model.currentStatus;

    try {
      applyTransition(model);
    } catch (error) {
      if (error instanceof InvalidStatusTransitionError) {
        this.logger.warn(`[RequestsService.transition] ${error.message}`);
        throw new ConflictException(error.message);
      }
      throw error;
    }

    const updated = await this.requestsRepository.updateStatus(
      id,
      model.currentStatus,
    );
    this.logger.log(
      `[RequestsService.transition] id=${id} ${previousStatus}→${model.currentStatus}`,
    );
    return toPurchaseRequestDto(updated);
  }
}
