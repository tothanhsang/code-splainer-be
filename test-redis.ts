import dotenv from "dotenv";
import { Redis } from "@upstash/redis";

// Load environment variables
dotenv.config();

async function testRedisConnection() {
  console.log("🔍 Testing Upstash Redis connection...\n");

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ Missing Upstash Redis credentials");
    console.log("Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env");
    process.exit(1);
  }

  try {
    console.log(`📍 Connecting to: ${process.env.UPSTASH_REDIS_REST_URL}`);

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test PING
    const pingResult = await redis.ping();
    console.log(`✅ PING: ${pingResult}\n`);

    // Test SET operation
    const testKey = "test:connection";
    const testValue = `Test at ${new Date().toISOString()}`;
    await redis.set(testKey, testValue, { ex: 60 }); // Expire in 60 seconds
    console.log(`✅ SET ${testKey} = ${testValue}`);

    // Test GET operation
    const retrievedValue = await redis.get(testKey);
    console.log(`✅ GET ${testKey} = ${retrievedValue}\n`);

    // Test DELETE operation
    await redis.del(testKey);
    console.log(`✅ DEL ${testKey}`);

    // Verify deletion
    const afterDelete = await redis.get(testKey);
    console.log(`✅ Verified deletion: ${afterDelete === null ? "null (success)" : afterDelete}\n`);

    console.log("🎉 All Redis operations successful!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Redis connection failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testRedisConnection();
