import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';

import { JwtConfigService } from '../../config/jwt.config';
import { GenerateParticipantMagicLinkPayload } from '../../shared/interface/generate-participant-magic-link.interface';
import { ParticipantsService } from '../participants.service';
@Injectable()
export class ParticipantStrategy extends PassportStrategy(
  Strategy,
  'participant',
) {
  constructor(
    private participantService: ParticipantsService,
    private jwtConfigService: JwtConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }

  async authenticate(request: Request): Promise<void> {
    console.log('Validating participant');
    const magicToken = request.headers['x-participant'] as string;
    if (!magicToken) {
      this.fail('No valid token', 401);
      return;
    }
    let payload: GenerateParticipantMagicLinkPayload;
    try {
      payload = this.jwtService.verify<GenerateParticipantMagicLinkPayload>(
        magicToken,
        {
          ignoreExpiration: true,
          secret: this.jwtConfigService.magicLinkTokenOptions.secret,
        },
      );
    } catch (error) {
      this.fail('Invalid token', 401);
      return;
    }

    const { meetingId, userEmail } = payload;
    const participant = await this.participantService.findOneParticipant(
      meetingId,
      userEmail,
    );
    if (!participant) {
      this.fail('Invalid token', 401);
      return;
    }

    const isMatch = await bcrypt.compare(
      magicToken,
      participant.hashedMagicLinkToken ?? '',
    );
    if (!isMatch) {
      this.fail('Token expired', 401);
      return;
    }

    this.success(participant);
    return;
  }
}