import { JwtResponseDto } from './dtos/jwt-response.dto';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginAuthGuard } from './guard/login-auth.guard';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { LoginUserDto } from './dtos/login-user.dto';
import { User } from '../users/user.entity';
import { Usr } from '../shared/decorators/user.decorator';
import { StatusResponseDto } from '../shared/dto/result-status.dto';
import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login to an account
   */
  @ApiCreatedResponse({
    description: 'Successfully logged in',
    type: JwtResponseDto,
  })
  @ApiBody({ type: LoginUserDto })
  @UseAuth(LoginAuthGuard)
  @Post('/login')
  async login(@Usr() user: User): Promise<JwtResponseDto> {
    const accessTokenDetails = this.authService.getJwtAccessToken(user);
    const refreshToken = this.authService.getJwtRefreshToken(user);

    await this.authService.saveRefreshToken(refreshToken, user);

    return {
      token_type: 'bearer',
      ...accessTokenDetails,
      refresh_token: refreshToken,
    };
  }

  /**
   * Create an account
   */
  @ApiCreatedResponse({
    description: 'Successfully created. Proceed to login',
    type: StatusResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid registration details',
  })
  @ApiConflictResponse({ description: 'Email already exists' })
  @Post('/signup')
  signup(@Body() createUserDto: CreateUserDto): Promise<StatusResponseDto> {
    return this.authService.signup(createUserDto).then(() => {
      return {
        success: true,
        message:
          'Successfully created account. Please verify email before logging in',
      };
    });
  }

  /**
   * Request a new JWT access token
   */
  @ApiQuery({
    name: 'grant_type',
    required: true,
    example: 'refresh_token',
  })
  @ApiQuery({ name: 'refresh_token', type: String, required: true })
  @ApiCreatedResponse({
    description: 'Successfully refreshed access token',
    type: JwtResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @UseAuth(JwtRefreshGuard)
  @Post('/refresh')
  async refresh(@Usr() user: User): Promise<JwtResponseDto> {
    const accessTokenDetails = this.authService.getJwtAccessToken(user);
    const refreshToken = this.authService.getJwtRefreshToken(user);

    await this.authService.saveRefreshToken(refreshToken, user);

    return {
      token_type: 'bearer',
      ...accessTokenDetails,
      refresh_token: refreshToken,
    };
  }

  /**
   * Logout of the account
   */
  @UseBearerAuth()
  @ApiCreatedResponse({
    description: 'Successfully logged out',
    type: StatusResponseDto,
  })
  @Post('/logout')
  async logout(@Usr() user: User): Promise<StatusResponseDto> {
    const success = await this.authService.deleteRefreshToken(user);
    return {
      success,
      message: 'See you again!',
    };
  }
}
