import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '../users/user.entity';
import { Participant } from 'src/participants/participant.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailConfirmation(user: User, url: string): Promise<boolean> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'MeetBalls Email Confirmation',
      template: './index',
      context: {
        title: 'Email Confirmation',
        username: user.firstName,
        content: 'Please click below to confirm your email',
        action_url: url,
        action_text: 'Confirm email',
      },
    });

    return true;
  }

  async sendPasswordReset(user: User, url: string): Promise<boolean> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'MeetBalls Password Reset',
      template: './index',
      context: {
        title: 'Password reset',
        username: user.firstName,
        content: 'Please click below to reset your password',
        action_url: url,
        action_text: 'Reset password',
      },
    });

    return true;
  }

  // TODO: Include the meeting name
  async sendMagicLink(
    participant: Participant,
    magicLink: string,
  ): Promise<boolean> {
    await this.mailerService.sendMail({
      to: participant.userEmail,
      subject: 'MeetBalls Meeting Invitation',
      template: './index',
      context: {
        title: 'Join MeetBalls Meeting',
        username: participant.userName,
        content: 'Please click the link below to join the MeetBalls meeting',
        action_url: magicLink,
        action_text: 'Join Meeting',
      },
    });

    return true;
  }
}
