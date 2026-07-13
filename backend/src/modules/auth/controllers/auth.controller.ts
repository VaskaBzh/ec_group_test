import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService, type AuthResponse } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

/**
 * HTTP entry point for authentication.
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
   * Register a new user and return an access token bundle.
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
   * Authenticate a user and return an access token bundle.
   *
   * @returns `200 OK` with tokens and the authenticated user.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<AuthResponse> {
    this.logger.debug('[AuthController.login] request received');
    return this.authService.login(body);
  }
}
