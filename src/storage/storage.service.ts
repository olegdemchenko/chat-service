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

  async add(key: string, id: string) {
    return await this.storage.set(key, id);
  }

  async delete(key: string) {
    return await this.storage.del(key);
  }

  async has(key: string) {
    return Boolean(await this.storage.exists(key));
  }

  async setAdd(key: string, value: string) {
    return await this.storage.sadd(key, value);
  }

  async setRemove(key: string, value: string) {
    return await this.storage.srem(key, value);
  }

  async setIsMember(key: string, value: string) {
    return Boolean(await this.storage.sismember(key, value));
  }
}
