import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Initialize Genkit with Google AI plugin
 * Genkit provides:
 * - Observability and tracing
 * - Prompt management
 * - Structured output with Zod
 * - Easy model switching
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: googleAI.model(process.env.GOOGLE_AI_MODEL || "gemini-2.5-pro"),
});

export default ai;
