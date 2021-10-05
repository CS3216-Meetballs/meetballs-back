import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';

import { CreateUserDto } from './dtos/create-user.dto';
import { JwtConfigService } from '../config/jwt.config';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';
import { TokenPayload } from './interface/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
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
    return await this.usersService.createUser({
      ...userDetails,
      passwordHash,
    });
  }

  // sendEmailConfirmation(email: string): Observable<boolean> {
  //   return this.usersService.findByEmail(email).pipe(
  //     map((user) => {
  //       if (!user) {
  //         throw new BadRequestException('Email does not exist');
  //       }

  //       const payload: EmailConfirmPayload = {
  //         sub: user.uuid,
  //         email: user.email,
  //         type: 'confirm',
  //       };
  //       const mailOptions = this.jwtConfigService.mailVerifyTokenOptions;
  //       const token = this.jwtService.sign(payload, {
  //         secret: mailOptions.secret,
  //         expiresIn: `${mailOptions.expiry}s`,
  //       });

  //       return {
  //         user,
  //         url: `${this.appConfigService.clientUrl}/app/confirm-email?token=${token}`,
  //       };
  //     }),
  //     mergeMap(({ user, url }) =>
  //       this.mailService.sendEmailConfirmation(user, url),
  //     ),
  //   );
  // }

  // sendPasswordResetUrl(email: string): Observable<boolean> {
  //   return this.usersService.findByEmail(email).pipe(
  //     map((user) => {
  //       if (!user) {
  //         throw new BadRequestException('Email does not exist');
  //       }

  //       const payload: PasswordResetPayload = {
  //         sub: user.uuid,
  //         hash: user.password_hash,
  //         type: 'reset',
  //       };
  //       const mailOptions = this.jwtConfigService.passwordResetTokenOptions;
  //       const token = this.jwtService.sign(payload, {
  //         secret: mailOptions.secret,
  //         expiresIn: `${mailOptions.expiry}s`,
  //       });

  //       return {
  //         user,
  //         url: `${this.appConfigService.clientUrl}/app/password-reset?token=${token}`,
  //       };
  //     }),
  //     mergeMap(({ user, url }) =>
  //       this.mailService.sendPasswordReset(user, url),
  //     ),
  //   );
  // }

  // confirmEmail(confirmEmailDto: ConfirmEmailDto): Observable<string> {
  //   try {
  //     const { token } = confirmEmailDto;
  //     let payload: EmailConfirmPayload;
  //     try {
  //       payload = this.jwtService.verify<EmailConfirmPayload>(token, {
  //         ignoreExpiration: false,
  //         secret: this.jwtConfigService.mailVerifyTokenOptions.secret,
  //       });
  //     } catch (error) {
  //       throw new BadRequestException('Invalid token');
  //     }

  //     const { email } = payload;
  //     return this.usersService.activateAccount(email).pipe(
  //       map((activated) => {
  //         if (!activated) {
  //           return 'Email already verified. Proceed to login.';
  //         } else {
  //           return 'Email successfully verified. Proceed to login.';
  //         }
  //       }),
  //     );
  //   } catch (err) {
  //     throw new BadRequestException('Invalid token');
  //   }
  // }

  // resetPassword(resetPasswordDto: ResetPasswordDto): Observable<string> {
  //   const { token, password } = resetPasswordDto;
  //   let payload: PasswordResetPayload;

  //   try {
  //     payload = this.jwtService.verify<PasswordResetPayload>(token, {
  //       ignoreExpiration: false,
  //       secret: this.jwtConfigService.passwordResetTokenOptions.secret,
  //     });
  //   } catch (error) {
  //     throw new BadRequestException('Invalid token');
  //   }

  //   const { sub, hash: previousHash } = payload;
  //   return this.usersService.findByUuid(sub).pipe(
  //     map((user) => {
  //       if (previousHash !== user.password_hash) {
  //         // invalid password hash in jwt token
  //         throw new UnauthorizedException();
  //       }
  //       return user;
  //     }),
  //     mergeMap(() => bcrypt.hash(password, 12)),
  //     mergeMap((newPasswordHash) =>
  //       this.usersService.setPassword(sub, newPasswordHash),
  //     ),
  //     map((changed) => {
  //       if (!changed) {
  //         throw new BadRequestException(
  //           'Password reset failed. Please try again',
  //         );
  //       } else {
  //         return 'Password successfully resetted. Proceed to login.';
  //       }
  //     }),
  //   );
  // }

  // changePassword(
  //   requester: User,
  //   changePasswordDto: ChangePasswordDto,
  // ): Observable<string> {
  //   const { newPassword, oldPassword } = changePasswordDto;

  //   return from(bcrypt.compare(oldPassword, requester.password_hash)).pipe(
  //     mergeMap((match) => {
  //       if (!match) {
  //         throw new BadRequestException('Incorrect password');
  //       } else {
  //         return bcrypt.hash(newPassword, 12);
  //       }
  //     }),
  //     mergeMap((newPasswordHash) => {
  //       return this.usersService.setPassword(requester.uuid, newPasswordHash);
  //     }),
  //     map((changed) => {
  //       if (!changed) {
  //         throw new BadRequestException(
  //           'Password change failed. Please try again',
  //         );
  //       } else {
  //         return 'Password successfully changed';
  //       }
  //     }),
  //   );
  // }
}
