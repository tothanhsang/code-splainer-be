#!/usr/bin/env tsx

/**
 * Genkit Dev UI Starter
 *
 * This file loads all flows and makes them available for the Genkit Dev UI.
 * Run with: npx genkit start -- tsx start-genkit.ts
 */

import dotenv from "dotenv";
import "./src/config/gemini";
import "./src/services/aiAnalysis.service";

// Load environment variables
dotenv.config();

console.log("🚀 Genkit flows loaded successfully!");
console.log("✅ Available flows:");
console.log("   - analyzeSpec");
console.log("");
console.log("📊 Genkit Dev UI should be running at http://localhost:4000");
console.log(
  "💡 If not, make sure you ran: npx genkit start -- tsx start-genkit.ts"
);
