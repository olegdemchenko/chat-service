import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { storageProvider } from './storage.provider';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [storageProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
