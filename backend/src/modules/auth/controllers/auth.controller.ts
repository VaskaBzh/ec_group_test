import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService, type AuthResponse } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../shared/types';

/**
 * HTTP entry point for authentication and session management.
 *
 * Deliberately thin: it delegates all logic to {@link AuthService} and returns
 * the issued tokens together with the public user. Request bodies are validated
 * and typed by the global `ZodValidationPipe` via the Zod-backed DTOs.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user and return a token bundle.
   *
   * @returns `201 Created` with tokens and the created user.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto): Promise<AuthResponse> {
    this.logger.debug('[AuthController.register] request received');
    return this.authService.register(body);
  }

  /**
   * Authenticate a user and return a token bundle.
   *
   * @returns `200 OK` with tokens and the authenticated user.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<AuthResponse> {
    this.logger.debug('[AuthController.login] request received');
    return this.authService.login(body);
  }

  /**
   * Rotate a refresh token for a fresh token bundle.
   *
   * @returns `200 OK` with a new token bundle and the user.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshDto): Promise<AuthResponse> {
    this.logger.debug('[AuthController.refresh] request received');
    return this.authService.refresh(body.refreshToken);
  }

  /**
   * Invalidate the refresh token of the current session.
   *
   * Idempotent by design, so it always answers `204 No Content`.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: RefreshDto): Promise<void> {
    this.logger.debug('[AuthController.logout] request received');
    await this.authService.logout(body.refreshToken);
  }

  /**
   * Revoke every active session of the authenticated user.
   *
   * Requires a valid access token; the owner is taken from the token, not the
   * body, so one session cannot log another user out.
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    this.logger.debug(`[AuthController.logoutAll] user=${user.id}`);
    await this.authService.logoutAll(user.id);
  }
}
