import { Inject, Injectable } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

const env = process.env;

export const appConfig = registerAs('app', () => ({
  environment: env.NODE_ENV,
  clientUrl: env.CLIENT_URL,
}));

@Injectable()
export class AppConfigService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  public get values() {
    return this.config;
  }

  public get isDev() {
    return this.config.environment === 'development';
  }

  public get isStaging() {
    return this.config.environment === 'staging';
  }

  public get isProd() {
    return this.config.environment === 'production';
  }

  public get clientUrl() {
    if (!this.isDev) {
      return env.CLIENT_URL;
    } else {
      return 'https://localhost:3000';
    }
  }
}
