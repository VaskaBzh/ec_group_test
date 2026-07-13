import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type PurchaseRequest, type User } from '@prisma/client';
import type {
  RequestSortField,
  RequestStatus,
  SortDirection,
} from '@ec-group/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/** A purchase request row with its author eagerly loaded. */
export type PurchaseRequestWithAuthor = PurchaseRequest & { author: User };

/** Data required to persist a new purchase request. */
export interface CreateRequestData {
  title: string;
  quantity: number;
  amount: Prisma.Decimal | number | string;
  comment?: string | null;
  authorId: string;
}

/** Parameters describing a single page of a sorted request list. */
export interface FindManyParams {
  sortField: RequestSortField;
  sortDirection: SortDirection;
  /** 1-based page index. */
  page: number;
  /** Number of items per page. */
  pageSize: number;
}

/** Include clause that eagerly loads the request author. */
const INCLUDE_AUTHOR = { author: true } as const;

/**
 * Data-access layer for the `PurchaseRequest` model.
 *
 * Owns every Prisma query touching purchase requests, including database-level
 * sorting (`orderBy`) and pagination (`skip`/`take`). The `author` sort field
 * is translated to an ordering on the related user's email.
 */
@Injectable()
export class RequestsRepository {
  private readonly logger = new Logger(RequestsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a new purchase request and return it with its author.
   *
   * @param data - Request fields plus the author id.
   */
  async create(data: CreateRequestData): Promise<PurchaseRequestWithAuthor> {
    this.logger.debug(
      `[RequestsRepository.create] authorId=${data.authorId} title=${data.title}`,
    );
    const created = await this.prisma.purchaseRequest.create({
      data: {
        title: data.title,
        quantity: data.quantity,
        amount: data.amount,
        comment: data.comment ?? null,
        authorId: data.authorId,
      },
      include: INCLUDE_AUTHOR,
    });
    this.logger.debug(`[RequestsRepository.create] created id=${created.id}`);
    return created;
  }

  /**
   * Fetch one page of purchase requests ordered by the requested field.
   *
   * @param params - Sort field/direction and pagination window.
   * @returns The requested slice, each item including its author.
   */
  async findMany(params: FindManyParams): Promise<PurchaseRequestWithAuthor[]> {
    const skip = (params.page - 1) * params.pageSize;
    this.logger.debug(
      `[RequestsRepository.findMany] sort=${params.sortField}:${params.sortDirection} page=${params.page} size=${params.pageSize}`,
    );

    const items = await this.prisma.purchaseRequest.findMany({
      orderBy: this.buildOrderBy(params.sortField, params.sortDirection),
      skip,
      take: params.pageSize,
      include: INCLUDE_AUTHOR,
    });

    this.logger.debug(`[RequestsRepository.findMany] returned=${items.length}`);
    return items;
  }

  /**
   * Count all purchase requests, used to compute pagination totals.
   */
  async count(): Promise<number> {
    const total = await this.prisma.purchaseRequest.count();
    this.logger.debug(`[RequestsRepository.count] total=${total}`);
    return total;
  }

  /**
   * Find a single purchase request by id, including its author.
   *
   * @returns The request, or `null` when the id does not exist.
   */
  async findById(id: string): Promise<PurchaseRequestWithAuthor | null> {
    this.logger.debug(`[RequestsRepository.findById] id=${id}`);
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: INCLUDE_AUTHOR,
    });
    this.logger.debug(`[RequestsRepository.findById] found=${request !== null}`);
    return request;
  }

  /**
   * Update the status of a purchase request.
   *
   * @param id - Request id.
   * @param status - New status to persist.
   * @returns The updated request with its author.
   */
  async updateStatus(
    id: string,
    status: RequestStatus,
  ): Promise<PurchaseRequestWithAuthor> {
    this.logger.debug(`[RequestsRepository.updateStatus] id=${id} status=${status}`);
    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: { status },
      include: INCLUDE_AUTHOR,
    });
    this.logger.debug(`[RequestsRepository.updateStatus] updated id=${updated.id}`);
    return updated;
  }

  /**
   * Translate a contract sort field into a Prisma `orderBy` clause.
   *
   * `author` orders by the related user's email; the remaining fields map
   * directly to purchase request columns.
   */
  private buildOrderBy(
    sortField: RequestSortField,
    sortDirection: SortDirection,
  ): Prisma.PurchaseRequestOrderByWithRelationInput {
    if (sortField === 'author') {
      return { author: { email: sortDirection } };
    }
    return { [sortField]: sortDirection };
  }
}
