import { Module } from '@nestjs/common';
import { Storage } from './storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [Storage, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
