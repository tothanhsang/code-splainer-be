import Redis from "ioredis";

// Khởi tạo Redis client (optional - để cache kết quả)
let redis: Redis | null = null;

try {
  if (process.env.REDIS_HOST) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
      console.log("⚠️  Redis error:", err.message);
    });
  }
} catch (error) {
  console.log("⚠️  Redis not configured, running without cache");
}

export default redis;
