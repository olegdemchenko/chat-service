import { Inject, Injectable } from '@nestjs/common';
import { Storage } from './storage.provider';

@Injectable()
export class StorageService {
  public constructor(
    @Inject('STORAGE')
    private readonly storage: Storage,
  ) {}

  async get(key: string) {
    return await this.storage.get(key);
  }

  async set(key: string, id: string) {
    return await this.storage.set(key, id);
  }

  async delete(key: string) {
    return await this.storage.del(key);
  }

  async has(key: string) {
    return Boolean(await this.storage.exists(key));
  }
}
