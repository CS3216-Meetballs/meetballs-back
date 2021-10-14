import { Inject, Injectable } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

const env = process.env;

export const zoomConfig = registerAs('zoom', () => ({
  clientId: env.ZOOM_CLIENT_ID,
  clientSecret: env.ZOOM_CLIENT_SECRET,
  verificationToken: env.ZOOM_VERIFICATION_TOKEN,
}));

@Injectable()
export class ZoomConfigService {
  constructor(
    @Inject(zoomConfig.KEY) private config: ConfigType<typeof zoomConfig>,
  ) {}

  public get values() {
    return this.config;
  }

  public get clientId() {
    return this.config.clientId;
  }

  public get clientSecret() {
    return this.config.clientSecret;
  }

  public get verificationToken() {
    return this.config.verificationToken;
  }

  public get base64Secret() {
    return Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');
  }
}
