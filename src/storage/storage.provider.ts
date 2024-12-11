import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export type Storage = Redis;

export const storageProvider: Provider = {
  inject: [ConfigService],
  provide: 'STORAGE',
  useFactory: (configService: ConfigService): Storage => {
    return new Redis(
      Number(configService.get<string>('REDIS_PORT')),
      configService.get<string>('REDIS_HOST'),
    );
  },
};
