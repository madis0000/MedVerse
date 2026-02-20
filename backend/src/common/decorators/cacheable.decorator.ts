import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';

export interface CacheableOptions {
  key: string;
  ttl?: number; // seconds
}

export const Cacheable = (options: CacheableOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any).cacheService;
      if (!cacheService || !cacheService.isAvailable()) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = `${options.key}:${JSON.stringify(args)}`;
      const ttl = options.ttl || 3600;

      return cacheService.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
};

export const InvalidateCache = (keyPattern: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const cacheService = (this as any).cacheService;
      if (cacheService && cacheService.isAvailable()) {
        await cacheService.delPattern(keyPattern);
      }

      return result;
    };

    return descriptor;
  };
};
