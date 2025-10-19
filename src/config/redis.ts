import { Redis as UpstashRedis } from "@upstash/redis";
import Redis from "ioredis";

// Unified Redis interface
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<number>;
}

// Wrapper for Upstash Redis to match ioredis interface
class UpstashRedisWrapper implements RedisClient {
  constructor(private client: UpstashRedis) {}

  async get(key: string): Promise<string | null> {
    const result = await this.client.get<string>(key);
    return result ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.set(key, value, { ex: seconds });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }
}

// Wrapper for ioredis to match our interface
class IoRedisWrapper implements RedisClient {
  constructor(private client: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(key, seconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }
}

// Khởi tạo Redis client (optional - để cache kết quả)
let redis: RedisClient | null = null;

try {
  // Check for Upstash Redis REST API first (recommended for serverless)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const upstashClient = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redis = new UpstashRedisWrapper(upstashClient);
    
    console.log("✅ Redis configured (Upstash REST API)");
  }
  // Fallback to standard Redis connection
  else if (process.env.REDIS_HOST) {
    const ioredisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
    });

    ioredisClient.on("connect", () => {
      console.log("✅ Redis connected (ioredis)");
    });

    ioredisClient.on("error", (err) => {
      console.log("⚠️  Redis error:", err.message);
    });

    redis = new IoRedisWrapper(ioredisClient);
  }
} catch (error) {
  console.log("⚠️  Redis not configured, running without cache");
}

export default redis;
