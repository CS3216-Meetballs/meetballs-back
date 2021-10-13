import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';

import { CreateUserDto } from './dtos/create-user.dto';
import { JwtConfigService } from '../config/jwt.config';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';
import { AppConfigService } from '../config/app.config';
import { MailService } from '../mail/mail.service';
import { TokenPayload } from '../shared/interface/token-payload.interface';
import { EmailConfirmPayload } from '../shared/interface/confirm-payload.interface';
import { PasswordResetPayload } from '../shared/interface/reset-payload.interface';
import ConfirmEmailDto from './dtos/confirm-email.dto';
import ResetPasswordDto from './dtos/reset-password.dto';
import ChangePasswordDto from './dtos/change-password.dto';
import { ZoomConfigService } from '../config/zoom.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly mailService: MailService,
    private readonly appConfigService: AppConfigService,
    private readonly zoomConfigService: ZoomConfigService,
    private readonly httpService: HttpService,
  ) {
    // this.httpService.axiosRef.interceptors.request.use(
    //   (config) => console.log(config),
    //   (error) => Promise.reject(error),
    // );
  }

  getZoomToken(code: string): Observable<JwtResponseDto & { scope: string }> {
    console.log(code);
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://meetballsapp.com/authorize',
    });
    return this.makeTokenRequest(params);
  }

  refreshZoomToken(
    token: string,
  ): Observable<JwtResponseDto & { scope: string }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
    });
    return this.makeTokenRequest(params);
  }

  private makeTokenRequest(params: URLSearchParams | Record<string, string>) {
    return this.httpService
      .post<JwtResponseDto & { scope: string }>(
        `oauth/token?${params.toString()}`,
        null,
        {
          auth: {
            username: this.zoomConfigService.clientId,
            password: this.zoomConfigService.clientSecret,
          },
        },
      )
      .pipe(
        map((result) => {
          return result.data;
        }),
        catchError((e) => {
          console.log(e);
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }

  /**
   * Gets login user using email and password
   */
  async validateLogin(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    // check password
    if (!user || !user.passwordHash) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }
    return user;
  }

  async getUserFromToken(accessToken: string): Promise<User> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(accessToken, {
        ignoreExpiration: false,
        secret: this.jwtConfigService.accessTokenOptions.secret,
      });
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }

    return this.usersService.findByUuid(payload.userId);
  }

  getJwtAccessToken(
    user: User,
  ): Pick<JwtResponseDto, 'access_token' | 'expires_in'> {
    const payload: TokenPayload = {
      userId: user.uuid,
      tokenType: 'access_token',
    };
    const jwtOptions = this.jwtConfigService.accessTokenOptions;
    const token = this.jwtService.sign(payload, {
      secret: jwtOptions.secret,
      expiresIn: `${jwtOptions.expiry}s`,
    });

    return { access_token: token, expires_in: +jwtOptions.expiry };
  }

  getJwtRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.uuid,
      tokenType: 'refresh_token',
    };
    const refreshOptions = this.jwtConfigService.refreshTokenOptions;
    const token = this.jwtService.sign(payload, {
      secret: refreshOptions.secret,
      expiresIn: `${refreshOptions.expiry}s`,
    });

    return token;
  }

  async saveRefreshToken(refreshToken: string, user: User): Promise<boolean> {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    return this.usersService.setRefreshToken(hashedToken, user.uuid);
  }

  deleteRefreshToken(user: User): Promise<boolean> {
    return this.usersService.removeRefreshToken(user.uuid);
  }

  async signup(createUserDto: CreateUserDto): Promise<User> {
    if (await this.usersService.doesEmailExist(createUserDto.email)) {
      throw new ConflictException('Email already exists');
    }

    const { password, ...userDetails } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 12);
    return this.usersService.createUser({
      ...userDetails,
      passwordHash,
    });
  }

  async sendEmailConfirmation(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const payload: EmailConfirmPayload = {
      userId: user.uuid,
      email: user.email,
      type: 'confirm',
    };
    const mailOptions = this.jwtConfigService.mailVerifyTokenOptions;
    const token = this.jwtService.sign(payload, {
      secret: mailOptions.secret,
      expiresIn: `${mailOptions.expiry}s`,
    });

    console.log('Confirm email token:', token);
    return this.mailService.sendEmailConfirmation(
      user,
      `${this.appConfigService.clientUrl}/confirm-email?token=${token}`,
    );
  }

  async sendPasswordResetUrl(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const payload: PasswordResetPayload = {
      userId: user.uuid,
      hash: user.passwordHash,
      type: 'reset',
    };
    const mailOptions = this.jwtConfigService.passwordResetTokenOptions;
    const token = this.jwtService.sign(payload, {
      secret: mailOptions.secret,
      expiresIn: `${mailOptions.expiry}s`,
    });

    console.log('Password reset token:', token);
    return this.mailService.sendPasswordReset(
      user,
      `${this.appConfigService.clientUrl}/password-reset?token=${token}`,
    );
  }

  async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<boolean> {
    try {
      const { token } = confirmEmailDto;
      let payload: EmailConfirmPayload;
      try {
        payload = this.jwtService.verify<EmailConfirmPayload>(token, {
          ignoreExpiration: false,
          secret: this.jwtConfigService.mailVerifyTokenOptions.secret,
        });
      } catch (error) {
        throw new BadRequestException('Invalid token');
      }

      const { email } = payload;
      return this.usersService.activateAccount(email);
    } catch (err) {
      throw new BadRequestException('Invalid token');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    const { token, password } = resetPasswordDto;
    let payload: PasswordResetPayload;

    try {
      payload = this.jwtService.verify<PasswordResetPayload>(token, {
        ignoreExpiration: false,
        secret: this.jwtConfigService.passwordResetTokenOptions.secret,
      });
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }

    const { userId, hash: previousHash } = payload;
    const user = await this.usersService.findByUuid(userId);

    if (previousHash !== user.passwordHash) {
      // invalid password hash in jwt token
      throw new UnauthorizedException();
    }
    const newPasswordHash = await bcrypt.hash(password, 12);
    const resetStatus = await this.usersService.setPassword(
      userId,
      newPasswordHash,
    );

    if (!resetStatus) {
      throw new BadRequestException('Password reset failed. Please try again');
    }
    return true;
  }

  async changePassword(
    requester: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<boolean> {
    const { newPassword, oldPassword } = changePasswordDto;

    const match = await bcrypt.compare(oldPassword, requester.passwordHash);
    if (!match) {
      throw new BadRequestException('Incorrect password');
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const success = await this.usersService.setPassword(
      requester.uuid,
      newPasswordHash,
    );

    if (!success) {
      throw new BadRequestException('Password change failed. Please try again');
    }
    return true;
  }
}
