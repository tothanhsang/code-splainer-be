import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
// Phase 1 (analyze-spec): 10MB for PDF files
// Phase 2 (code-review): 50MB for codebase ZIP files
app.use(
  fileUpload({
    limits: {
      fileSize: parseInt(process.env.MAX_ZIP_SIZE || "52428800"), // 50MB default for Phase 2
    },
    abortOnLimit: true,
    useTempFiles: false, // Keep files in memory for simplicity
    debug: process.env.NODE_ENV === "development",
  })
);

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "DevInsight AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "DevInsight AI Backend",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      // Phase 1: Spec Analyzer
      analyzeSpec: "POST /api/analyze-spec",
      history: "GET /api/analyze-spec/history",
      getAnalysis: "GET /api/analyze-spec/:id",
      // Phase 2: Code Review Assistant
      getContext: "GET /api/code-review/context/:contextId",
      uploadContext: "POST /api/code-review/upload-context",
      reviewChanges: "POST /api/code-review/review-changes",
      quickReview: "POST /api/code-review/quick-review",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error:", err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("🚀 DevInsight AI Backend");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
