import { ai } from "../config/gemini";
import { z } from "zod";
import crypto from "crypto";
import redis from "../config/redis";
import {
  CODE_REVIEW_PROMPT,
  buildProjectContext,
  buildChangesContent,
} from "../prompts/codeReview.prompt";

/**
 * Zod schema for code review output
 * Note: Using .nullish() to accept both undefined and null from AI
 */
const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number().nullish(), // Allow undefined or null
  severity: z.enum(["critical", "high", "medium", "low"]),
  issue: z.string(),
  suggestion: z.string(),
});

const ImprovementSchema = z.object({
  file: z.string(),
  line: z.number().nullish(), // Allow undefined or null
  type: z.enum(["refactoring", "optimization", "best-practice"]),
  suggestion: z.string(),
});

const CodeReviewSchema = z.object({
  overallQuality: z.string(),
  summary: z.object({
    totalIssues: z.number(),
    criticalIssues: z.number(),
    filesReviewed: z.number(),
  }),
  potentialBugs: z.array(ReviewCommentSchema),
  performanceIssues: z.array(ReviewCommentSchema),
  securityVulnerabilities: z.array(ReviewCommentSchema),
  conventionViolations: z.array(ReviewCommentSchema),
  improvements: z.array(ImprovementSchema),
  positivePoints: z.array(z.string()),
});

export type CodeReviewResult = z.infer<typeof CodeReviewSchema>;

/**
 * Input schema for Genkit flow
 */
const CodeReviewInput = z.object({
  projectContext: z.string(),
  changesContent: z.string(),
  changeDescription: z.string(),
});

/**
 * Genkit Flow for code review
 */
export const codeReviewFlow = ai.defineFlow(
  {
    name: "codeReview",
    inputSchema: CodeReviewInput,
    outputSchema: CodeReviewSchema,
  },
  async ({ projectContext, changesContent, changeDescription }) => {
    console.log("🔍 Starting code review...");
    console.log(`📝 Change description: ${changeDescription}`);
    console.log(`📊 Project context size: ${projectContext.length} chars`);
    console.log(`📊 Changes size: ${changesContent.length} chars`);

    // Generate prompt using centralized template
    const prompt = CODE_REVIEW_PROMPT({
      projectContext,
      changesContent,
      changeDescription,
    });

    // Use ai.generate() with Genkit
    const llmResponse = await ai.generate(prompt);

    if (!llmResponse.text) {
      throw new Error("AI did not return a result");
    }

    // Parse and validate JSON response
    const cleanedText = llmResponse.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsedResponse = JSON.parse(cleanedText);
    const review = CodeReviewSchema.parse(parsedResponse);

    console.log("✅ Code review complete");
    console.log(`📊 Total issues found: ${review.summary.totalIssues}`);
    console.log(`⚠️  Critical issues: ${review.summary.criticalIssues}`);

    return review;
  }
);

/**
 * Service class for Code Review
 */
export class CodeReviewService {
  /**
   * Generate cache key from content
   */
  private createCacheKey(
    projectContext: string,
    changesContent: string
  ): string {
    const combined = projectContext + changesContent;
    const hash = crypto.createHash("md5").update(combined).digest("hex");
    return `code_review:${hash}`;
  }

  /**
   * Main review method with caching
   */
  async reviewCode(
    projectFiles: Array<{ path: string; content: string }>,
    changedFiles: Array<{ path: string; content: string; isDiff?: boolean }>,
    changeDescription: string
  ): Promise<CodeReviewResult> {
    // Build contexts
    const projectContext = buildProjectContext(projectFiles);
    const changesContent = buildChangesContent(changedFiles);

    // Create cache key
    const cacheKey = this.createCacheKey(projectContext, changesContent);

    // Check cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log("✅ Cache hit - returning cached review");
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn("⚠️  Redis get error:", error);
      }
    }

    console.log("🤖 Running AI code review...");

    // Run Genkit flow
    const review = await codeReviewFlow({
      projectContext,
      changesContent,
      changeDescription,
    });

    // Cache result
    if (redis) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(review)); // 1 hour TTL
        console.log("✅ Review result cached");
      } catch (error) {
        console.warn("⚠️  Redis set error:", error);
      }
    }

    return review;
  }

  /**
   * Review with project context stored in session/memory
   * For demo: simplified version
   */
  async reviewWithStoredContext(
    storedProjectContext: string,
    changedFiles: Array<{ path: string; content: string; isDiff?: boolean }>,
    changeDescription: string
  ): Promise<CodeReviewResult> {
    const changesContent = buildChangesContent(changedFiles);
    const cacheKey = this.createCacheKey(storedProjectContext, changesContent);

    // Check cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log("✅ Cache hit - returning cached review");
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn("⚠️  Redis get error:", error);
      }
    }

    console.log("🤖 Running AI code review with stored context...");

    // Run Genkit flow
    const review = await codeReviewFlow({
      projectContext: storedProjectContext,
      changesContent,
      changeDescription,
    });

    // Cache result
    if (redis) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(review));
        console.log("✅ Review result cached");
      } catch (error) {
        console.warn("⚠️  Redis set error:", error);
      }
    }

    return review;
  }

  /**
   * Store project context in Redis for later use
   * Returns a context ID
   */
  async storeProjectContext(
    projectFiles: Array<{ path: string; content: string }>
  ): Promise<string> {
    const projectContext = buildProjectContext(projectFiles);
    const contextId = crypto.randomBytes(16).toString("hex");
    const key = `project_context:${contextId}`;
    const metaKey = `project_context_meta:${contextId}`;

    if (redis) {
      try {
        // Calculate stats
        const filesByExtension: Record<string, number> = {};
        let totalLines = 0;
        let sizeInBytes = 0;

        projectFiles.forEach((file) => {
          const ext = file.path.split(".").pop() || "no-extension";
          filesByExtension[`.${ext}`] = (filesByExtension[`.${ext}`] || 0) + 1;
          totalLines += file.content.split("\n").length;
          sizeInBytes += Buffer.byteLength(file.content, "utf8");
        });

        const metadata = {
          totalFiles: projectFiles.length,
          totalLines,
          sizeInBytes,
          filesByExtension,
          createdAt: new Date().toISOString(),
        };

        // Store context and metadata for 24 hours
        await redis.setex(key, 86400, projectContext);
        await redis.setex(metaKey, 86400, JSON.stringify(metadata));

        console.log(`✅ Project context stored with ID: ${contextId}`);
        return contextId;
      } catch (error) {
        console.error("❌ Failed to store project context:", error);
        throw new Error("Failed to store project context");
      }
    } else {
      throw new Error("Redis is not available");
    }
  }

  /**
   * Retrieve stored project context
   */
  async getProjectContext(contextId: string): Promise<string | null> {
    if (!redis) {
      return null;
    }

    try {
      const key = `project_context:${contextId}`;
      const context = await redis.get(key);
      return context;
    } catch (error) {
      console.error("❌ Failed to retrieve project context:", error);
      return null;
    }
  }

  /**
   * Get context information (metadata only, not full content)
   * For FE to check context before review
   */
  async getContextInfo(contextId: string): Promise<{
    contextId: string;
    exists: boolean;
    stats?: {
      totalFiles: number;
      totalLines: number;
      sizeInBytes: number;
      filesByExtension: Record<string, number>;
    };
    expiresIn?: number; // seconds until expiration
    createdAt?: Date;
  } | null> {
    if (!redis) {
      return null;
    }

    try {
      const key = `project_context:${contextId}`;
      const metaKey = `project_context_meta:${contextId}`;

      // Check if context exists
      const exists = await redis.exists(key);

      if (!exists) {
        return {
          contextId,
          exists: false,
        };
      }

      // Get TTL (time to live)
      const ttl = await redis.ttl(key);

      // Try to get metadata
      const metaData = await redis.get(metaKey);
      let stats;

      if (metaData) {
        stats = JSON.parse(metaData);
      }

      return {
        contextId,
        exists: true,
        stats,
        expiresIn: ttl > 0 ? ttl : undefined,
        createdAt: stats?.createdAt ? new Date(stats.createdAt) : undefined,
      };
    } catch (error) {
      console.error("❌ Failed to get context info:", error);
      return null;
    }
  }

  /**
   * Get review statistics
   */
  getReviewStats(review: CodeReviewResult): {
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
    issuesByCategory: Record<string, number>;
  } {
    const issuesBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const issuesByCategory: Record<string, number> = {
      bugs: review.potentialBugs.length,
      performance: review.performanceIssues.length,
      security: review.securityVulnerabilities.length,
      convention: review.conventionViolations.length,
    };

    // Count by severity
    [
      ...review.potentialBugs,
      ...review.performanceIssues,
      ...review.securityVulnerabilities,
      ...review.conventionViolations,
    ].forEach((issue) => {
      issuesBySeverity[issue.severity]++;
    });

    return {
      totalIssues: review.summary.totalIssues,
      issuesBySeverity,
      issuesByCategory,
    };
  }
}

export default new CodeReviewService();
