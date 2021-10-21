import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';

import { JwtConfigService } from '../../config/jwt.config';
import { GenerateParticipantMagicLinkPayload } from '../../shared/interface/generate-participant-magic-link.interface';
import { Participant } from '../../participants/participant.entity';
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

  async validate(request: Request): Promise<Participant> {
    const magicToken = request.headers['x-participant'] as string;
    if (!magicToken) {
      throw new UnauthorizedException('No valid token');
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
      throw new UnauthorizedException('Invalid token');
    }

    const { meetingId, userEmail } = payload;
    const participant = await this.participantService.findOneParticipant(
      meetingId,
      userEmail,
    );
    if (!participant) {
      throw new UnauthorizedException('Invalid token');
    }

    const isMatch = await bcrypt.compare(
      magicToken,
      participant.hashedMagicLinkToken ?? '',
    );
    if (!isMatch) {
      throw new UnauthorizedException('Token expired');
    }

    return participant;
  }
}
