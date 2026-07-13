import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  PaginatedResult,
  PurchaseRequestDto,
} from '@ec-group/contracts';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../shared/types';
import { RequestsService } from '../services/requests.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { ListRequestsQueryDto } from '../dto/list-requests.query.dto';

/**
 * HTTP entry point for purchase requests.
 *
 * Every route requires a valid JWT (`JwtAuthGuard`) and a specific role
 * (`RolesGuard` + `@Roles`): requesters create requests, reviewers list and
 * decide them. Controllers stay thin — all logic lives in
 * {@link RequestsService}.
 */
@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(private readonly requestsService: RequestsService) {}

  /**
   * Create a purchase request for the authenticated requester.
   *
   * @returns `201 Created` with the new request.
   */
  @Post()
  @Roles('Requester')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateRequestDto,
  ): Promise<PurchaseRequestDto> {
    this.logger.debug(`[RequestsController.create] user=${user.id}`);
    return this.requestsService.create(user.id, body);
  }

  /**
   * List purchase requests for a reviewer, sorted and paginated.
   *
   * @returns `200 OK` with a page of requests and pagination metadata.
   */
  @Get()
  @Roles('Reviewer')
  async list(
    @Query() query: ListRequestsQueryDto,
  ): Promise<PaginatedResult<PurchaseRequestDto>> {
    this.logger.debug(
      `[RequestsController.list] sort=${query.sortField}:${query.sortDirection} page=${query.page} size=${query.pageSize}`,
    );
    return this.requestsService.list(query);
  }

  /**
   * Approve a pending request (reviewer only).
   *
   * @returns `200 OK` with the updated request.
   */
  @Patch(':id/approve')
  @Roles('Reviewer')
  async approve(@Param('id') id: string): Promise<PurchaseRequestDto> {
    this.logger.debug(`[RequestsController.approve] id=${id}`);
    return this.requestsService.approve(id);
  }

  /**
   * Reject a pending request (reviewer only).
   *
   * @returns `200 OK` with the updated request.
   */
  @Patch(':id/reject')
  @Roles('Reviewer')
  async reject(@Param('id') id: string): Promise<PurchaseRequestDto> {
    this.logger.debug(`[RequestsController.reject] id=${id}`);
    return this.requestsService.reject(id);
  }
}
