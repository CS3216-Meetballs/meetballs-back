import { AuthService } from './../auth.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';

@Injectable()
export class ParticipantStrategy extends PassportStrategy(
  Strategy,
  'participant',
) {
  constructor(private authService: AuthService) {
    super();
  }

  async authenticate(request: Request): Promise<void> {
    console.log('Validating participant');
    const magicToken = request.headers['x-participant'] as string;
    if (!magicToken) {
      this.fail('No valid token', 401);
      return;
    }
    const participant = await this.authService.getParticipantFromToken(
      magicToken,
    );

    if (!participant) {
      this.fail('No valid token', 401);
    } else {
      this.success(participant);
    }
    return;
  }
}
