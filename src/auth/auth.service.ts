import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import { JwtConfigService } from '../config/jwt.config';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';
import { TokenPayload } from './interface/token-payload.interface';
import { AppConfigService } from '../config/app.config';
import { MailService } from '../mail/mail.service';
import { EmailConfirmPayload } from './interface/confirm-payload.interface';
import { PasswordResetPayload } from './interface/reset-payload.interface';
import ConfirmEmailDto from './dtos/confirm-email.dto';
import ResetPasswordDto from './dtos/reset-password.dto';
import ChangePasswordDto from './dtos/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly mailService: MailService,
    private readonly appConfigService: AppConfigService,
  ) {}

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

  getJwtAccessToken(
    user: User,
  ): Pick<JwtResponseDto, 'access_token' | 'expires_in'> {
    const payload: TokenPayload = {
      userId: user.uuid,
      type: 'access',
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
      type: 'refresh',
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
      `${this.appConfigService.clientUrl}/app/password-reset?token=${token}`,
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