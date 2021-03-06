import { SeederConfigService } from '../config/seeder.config';
import { ISeeder } from './seeder.interface';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    private readonly seederConfigService: SeederConfigService,
    private readonly seeders: ISeeder[],
  ) {
    this.seeders = seeders;
    this.seederConfigService = seederConfigService;
  }

  onApplicationBootstrap() {
    return this.run();
  }

  async run(): Promise<any> {
    if (!this.seederConfigService.shouldSeed) {
      return Promise.resolve();
    }

    console.log('Starting seed...');
    return this.seed();
  }

  async seed(): Promise<any> {
    for (const seeder of this.seeders) {
      console.log(`Starting ${seeder.constructor.name}...`);
      await seeder.seed();
      console.log(`${seeder.constructor.name} completed`);
    }
  }

  // unused
  async drop(): Promise<any> {
    for (const seeder of this.seeders) {
      await seeder.drop();
    }
  }
}
