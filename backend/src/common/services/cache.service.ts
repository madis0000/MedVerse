import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private enabled = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisHost = this.configService.get('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get('REDIS_PORT', '6379');
      const redisUrl = this.configService.get('REDIS_URL', `redis://${redisHost}:${redisPort}`);
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      await this.redis.connect();
      this.enabled = true;
    } catch (error) {
      console.warn('Redis connection failed, caching disabled:', error.message);
      this.redis = null;
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Silently fail - caching is non-critical
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // Silently fail
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // Silently fail
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  isAvailable(): boolean {
    return this.enabled;
  }
}
