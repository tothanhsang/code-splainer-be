import { ai } from "../config/gemini";
import redis from "../config/redis";
import crypto from "crypto";
import { z } from "zod";
import {
  SPEC_ANALYSIS_PROMPT,
  buildDocumentSections,
} from "../prompts/specAnalysis.prompt";

/**
 * Schema for FSD analysis result - Advanced version
 * Matches prompt_sample.md structure
 */
export const SpecAnalysisSchema = z.object({
  sourceDocuments: z.array(z.string()).describe("List of analyzed file names"),
  analysisFocus: z.string().describe("Analysis focus from user"),
  featureOverview: z.object({
    name: z.string().describe("Feature name"),
    goal: z
      .string()
      .describe(
        "Goal: This feature helps [who] to [do what] to [achieve what]"
      ),
    summary: z.string().describe("Overview summary"),
  }),
  forDevelopers: z.object({
    userStories: z
      .array(z.string())
      .describe("Related user stories focusing on main points"),
    coreFunctions: z
      .array(z.string())
      .describe("Core technical functions to implement"),
    dataRequirements: z
      .string()
      .describe("Data requirements: input, output, database changes"),
    technicalNotes: z.array(z.string()).describe("Important technical notes"),
  }),
  forTesters: z.object({
    acceptanceCriteria: z
      .array(z.string())
      .describe("Acceptance criteria in Given/When/Then format"),
    happyPath: z.string().describe("Main successful workflow"),
    edgeCasesAndRisks: z
      .array(z.string())
      .describe("Edge cases, error flows, and risks"),
    nonFunctionalRequirements: z
      .string()
      .describe("NFRs: performance, security, etc."),
  }),
});

export type SpecAnalysisResult = z.infer<typeof SpecAnalysisSchema>;

/**
 * Genkit Flow for FSD analysis
 * Flow provides:
 * - Automatic tracing and logging
 * - Input/output validation
 * - Error handling
 * - Observability in Genkit Dev UI
 */
/**
 * Input schema for multi-document analysis
 */
export const MultiDocumentInput = z.object({
  originDocument: z.object({
    fileName: z.string(),
    content: z.string(),
  }),
  childDocuments: z
    .array(
      z.object({
        fileName: z.string(),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  analysisFocus: z.string().optional().default("All features"),
});

export type MultiDocumentInputType = z.infer<typeof MultiDocumentInput>;

export const analyzeSpecFlow: (
  input: MultiDocumentInputType
) => Promise<SpecAnalysisResult> = ai.defineFlow(
  {
    name: "analyzeSpec",
    inputSchema: MultiDocumentInput,
    outputSchema: SpecAnalysisSchema,
  },
  async ({
    originDocument,
    childDocuments = [],
    analysisFocus = "All features",
  }: MultiDocumentInputType): Promise<SpecAnalysisResult> => {
    // Build list of all document names
    const allDocumentNames = [
      originDocument.fileName,
      ...childDocuments.map((doc) => doc.fileName),
    ];

    // Build document sections using helper function
    const documentSections = buildDocumentSections(
      originDocument,
      childDocuments
    );

    // Generate prompt using centralized template
    const prompt = SPEC_ANALYSIS_PROMPT({
      allDocumentNames,
      analysisFocus,
      documentSections,
    });

    console.log(
      `🤖 Analyzing ${allDocumentNames.length} documents with Genkit + Gemini AI...`
    );
    console.log(`📄 Origin document: ${originDocument.fileName}`);
    if (childDocuments.length > 0) {
      console.log(
        `📄 Child documents: ${childDocuments
          .map((d) => d.fileName)
          .join(", ")}`
      );
    }
    console.log(`🎯 Focus: ${analysisFocus}`);

    // Use ai.generate() - Genkit will automatically validate output with outputSchema defined in flow
    const llmResponse = await ai.generate(prompt);

    // Parse and validate response
    const responseText = llmResponse.text;

    if (!responseText) {
      throw new Error("AI did not return a result");
    }

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (error) {
      throw new Error(`Cannot parse JSON response: ${responseText}`);
    }

    // Validate with Zod schema
    const analysis = SpecAnalysisSchema.parse(parsedResponse);

    console.log("✅ FSD analysis complete");
    return analysis;
  }
);

/**
 * Service for FSD analysis using AI with Genkit
 */
export class AIAnalysisService {
  /**
   * Create cache key from text
   */
  private createCacheKey(text: string): string {
    return `spec_analysis:${crypto
      .createHash("md5")
      .update(text)
      .digest("hex")}`;
  }

  /**
   * Analyze FSD using Genkit Flow - Multi-document version
   * With Redis caching
   * @param originDocument - Origin document {fileName, content}
   * @param childDocuments - Child documents (optional)
   * @param analysisFocus - Analysis focus (optional)
   */
  async analyzeSpec(
    originDocument: { fileName: string; content: string },
    childDocuments?: Array<{ fileName: string; content: string }>,
    analysisFocus?: string
  ): Promise<SpecAnalysisResult> {
    try {
      // Create cache key from all documents
      const allContent =
        originDocument.content +
        (childDocuments || []).map((d) => d.content).join("");

      // Check cache if Redis is available
      if (redis) {
        const cacheKey = this.createCacheKey(allContent);
        const cached = await redis.get(cacheKey);

        if (cached) {
          console.log("✅ Returning result from cache");
          return JSON.parse(cached);
        }
      }

      // Run Genkit flow with multi-document parameters
      const result = await analyzeSpecFlow({
        originDocument,
        childDocuments: childDocuments || [],
        analysisFocus: analysisFocus || "All features",
      });

      // Save to cache if Redis is available (cache for 1 hour)
      if (redis) {
        const cacheKey = this.createCacheKey(allContent);
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error analyzing FSD: ${error.message}`);
      }
      throw new Error("Unknown error while analyzing FSD");
    }
  }
}

export default new AIAnalysisService();
