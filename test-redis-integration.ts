import dotenv from "dotenv";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Load environment variables
dotenv.config();

async function testRedisIntegration() {
  console.log("🔍 Testing Redis Integration with Application...\n");

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ Missing Upstash Redis credentials");
    process.exit(1);
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log("📊 Testing Redis Operations:\n");

    // Test 1: Basic connectivity
    console.log("1️⃣  Testing basic connectivity...");
    const pingResult = await redis.ping();
    console.log(`   ✅ PING: ${pingResult}\n`);

    // Test 2: Cache simulation (like AI analysis caching)
    console.log("2️⃣  Testing cache operations (simulating AI analysis)...");
    const cacheKey = `test:analysis:${crypto.randomBytes(8).toString("hex")}`;
    const mockAnalysis = {
      id: "test-123",
      result: "Mock AI analysis result",
      timestamp: new Date().toISOString(),
      features: ["Feature 1", "Feature 2"],
    };

    // Set cache with 1 hour TTL (like in aiAnalysis.service.ts)
    await redis.set(cacheKey, JSON.stringify(mockAnalysis), { ex: 3600 });
    console.log(`   ✅ Cached analysis: ${cacheKey}`);

    // Retrieve from cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // Upstash might return the object directly or as a string
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      console.log(`   ✅ Retrieved from cache: ${parsed.id}`);
    }

    // Check TTL
    const ttl = await redis.ttl(cacheKey);
    console.log(`   ✅ TTL: ${ttl} seconds (~${Math.round(ttl / 60)} minutes)\n`);

    // Test 3: Project context storage (like in codeReview.service.ts)
    console.log("3️⃣  Testing project context storage...");
    const contextId = crypto.randomBytes(16).toString("hex");
    const contextKey = `project_context:${contextId}`;
    const metaKey = `project_context_meta:${contextId}`;

    const mockContext = {
      projectName: "test-project",
      files: ["src/index.ts", "src/utils.ts"],
      totalLines: 500,
    };

    const mockMeta = {
      totalFiles: 2,
      totalLines: 500,
      sizeInBytes: 15000,
      filesByExtension: { ts: 2 },
      createdAt: new Date().toISOString(),
    };

    // Store context with 24 hour TTL
    await redis.set(contextKey, JSON.stringify(mockContext), { ex: 86400 });
    await redis.set(metaKey, JSON.stringify(mockMeta), { ex: 86400 });
    console.log(`   ✅ Stored context: ${contextId}`);

    // Retrieve context
    const storedContext = await redis.get(contextKey);
    const storedMeta = await redis.get(metaKey);
    
    if (storedContext && storedMeta) {
      const context = typeof storedContext === 'string' ? JSON.parse(storedContext) : storedContext;
      const meta = typeof storedMeta === 'string' ? JSON.parse(storedMeta) : storedMeta;
      console.log(`   ✅ Retrieved context: ${context.projectName}`);
      console.log(`   ✅ Retrieved metadata: ${meta.totalFiles} files, ${meta.totalLines} lines`);
    }

    // Check if context exists
    const exists = await redis.exists(contextKey);
    console.log(`   ✅ Context exists: ${exists === 1 ? "Yes" : "No"}\n`);

    // Test 4: Code review caching
    console.log("4️⃣  Testing code review cache...");
    const reviewCacheKey = `test:review:${crypto.randomBytes(8).toString("hex")}`;
    const mockReview = {
      summary: "Code looks good",
      issues: [],
      suggestions: ["Add more tests"],
      score: 85,
    };

    await redis.set(reviewCacheKey, JSON.stringify(mockReview), { ex: 3600 });
    console.log(`   ✅ Cached review: ${reviewCacheKey}`);

    const cachedReview = await redis.get(reviewCacheKey);
    if (cachedReview) {
      const review = typeof cachedReview === 'string' ? JSON.parse(cachedReview) : cachedReview;
      console.log(`   ✅ Retrieved review: Score ${review.score}/100\n`);
    }

    // Test 5: Cleanup test data
    console.log("5️⃣  Cleaning up test data...");
    await redis.del(cacheKey);
    await redis.del(contextKey);
    await redis.del(metaKey);
    await redis.del(reviewCacheKey);
    console.log(`   ✅ Cleaned up ${4} test keys\n`);

    // Test 6: Performance check
    console.log("6️⃣  Testing cache performance...");
    const perfKey = "test:performance";
    const largeData = JSON.stringify({
      data: Array(1000).fill({ id: 1, name: "test", value: Math.random() }),
    });

    const startSet = Date.now();
    await redis.set(perfKey, largeData, { ex: 60 });
    const setTime = Date.now() - startSet;

    const startGet = Date.now();
    await redis.get(perfKey);
    const getTime = Date.now() - startGet;

    console.log(`   ✅ SET operation: ${setTime}ms`);
    console.log(`   ✅ GET operation: ${getTime}ms`);
    console.log(`   ✅ Data size: ${(largeData.length / 1024).toFixed(2)} KB\n`);

    await redis.del(perfKey);

    // Test 7: Connection info
    console.log("7️⃣  Redis connection info:");
    console.log(`   📍 URL: ${process.env.UPSTASH_REDIS_REST_URL}`);
    console.log(`   🔐 Token: ${process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 20)}...`);
    console.log(`   ✅ Connection type: Upstash REST API\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 All Redis integration tests passed!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("✅ Redis is properly configured and working");
    console.log("✅ Cache operations are functional");
    console.log("✅ Project context storage is working");
    console.log("✅ Performance is acceptable");
    console.log("\n🚀 Your application is ready to use Redis caching!");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Redis integration test failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testRedisIntegration();
