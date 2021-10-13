import { map, Observable } from 'rxjs';
import { JwtResponseDto } from './dtos/jwt-response.dto';
import { Body, Controller, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginAuthGuard } from './guard/login-auth.guard';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { LoginUserDto } from './dtos/login-user.dto';
import { User } from '../users/user.entity';
import { Usr } from '../shared/decorators/user.decorator';
import { StatusResponseDto } from '../shared/dto/result-status.dto';
import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';
import ChangePasswordDto from './dtos/change-password.dto';
import ConfirmEmailDto from './dtos/confirm-email.dto';
import ForgetPasswordDto from './dtos/forget-password.dto';
import ResendConfirmationDto from './dtos/resend-confirmation.dto';
import ResetPasswordDto from './dtos/reset-password.dto';

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
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<StatusResponseDto> {
    const user = await this.authService.signup(createUserDto);

    await this.authService.sendEmailConfirmation(user.email).then(() => {
      console.log('Verification email sent');
      return user;
    });

    return {
      success: true,
      message:
        'Successfully created account. Please verify email before logging in',
    };
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

  //============ Email Confirmation endpoint ===============

  /**
   * Request email confirmation mail
   */
  @ApiCreatedResponse({
    description: 'Confirmation request sent to email',
    type: StatusResponseDto,
  })
  @Post('/resend-confirm')
  async resendConfirmationEmail(
    @Body() resendConfirmDto: ResendConfirmationDto,
  ): Promise<StatusResponseDto> {
    await this.authService.sendEmailConfirmation(resendConfirmDto.email);

    return {
      success: true,
      message: 'Email sent! Check your mailbox for confirmation email.',
    };
  }

  /**
   * Validate user's email confirmation request
   */
  @ApiCreatedResponse({
    description: 'Email confirmed',
    type: StatusResponseDto,
  })
  @Post('/confirm')
  async confirmEmail(
    @Body() confirmEmailDto: ConfirmEmailDto,
  ): Promise<StatusResponseDto> {
    const isActivated = await this.authService.confirmEmail(confirmEmailDto);

    if (!isActivated) {
      return {
        success: true,
        message: 'Email already verified. Proceed to login.',
      };
    } else {
      return {
        success: true,
        message: 'Email successfully verified. Proceed to login.',
      };
    }
  }

  // ============ Password related endpoint ===============

  /**
   * Request password reset email
   */
  @ApiCreatedResponse({
    description: 'Reset request sent to email',
    type: StatusResponseDto,
  })
  @Post('/forget-password')
  async requestPasswordResetEmail(
    @Body() forgetPasswordDto: ForgetPasswordDto,
  ): Promise<StatusResponseDto> {
    await this.authService.sendPasswordResetUrl(forgetPasswordDto.email);

    return {
      success: true,
      message: 'Email sent! Check your mailbox for password reset email.',
    };
  }

  /**
   * Validate user's password reset request
   */
  @ApiCreatedResponse({
    description: 'Password successfully reseted',
    type: StatusResponseDto,
  })
  @Post('/password-reset')
  async confirmPasswordReset(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<StatusResponseDto> {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      success: true,
      message: 'Password successfully resetted. Proceed to login.',
    };
  }

  /**
   * Request to Change password
   */
  @UseBearerAuth()
  @ApiCreatedResponse({
    description: 'Password changed',
    type: StatusResponseDto,
  })
  @Post('/change-password')
  async changePassword(
    @Usr() requester: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<StatusResponseDto> {
    await this.authService.changePassword(requester, changePasswordDto);

    return {
      success: true,
      message: 'Password successfully changed',
    };
  }

  /**
   * Login to zoom account by requesting access token
   */
  @ApiQuery({
    name: 'code',
    description: 'The authorization code provided by /zoom/authorize',
  })
  @Post('/zoom/login')
  getToken(@Query('code') code: string): Observable<JwtResponseDto> {
    return this.authService.getToken(code).pipe(
      map((tokenData) => {
        const { scope, ...tokenOutput } = tokenData;
        return tokenOutput;
      }),
    );
  }

  /**
   * Request a new access token
   */
  @ApiQuery({
    name: 'refresh_token',
    description: 'The zoom refresh token',
  })
  @Post('/zoom/refresh')
  refreshToken(
    @Query('refresh_token') token: string,
  ): Observable<JwtResponseDto> {
    return this.authService.refreshToken(token).pipe(
      map((tokenData) => {
        // this.authService.saveRefreshToken(tokenData.refresh_token);
        const { scope, ...tokenOutput } = tokenData;
        return tokenOutput;
      }),
    );
  }
}
