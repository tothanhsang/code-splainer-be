import { Router } from "express";
import specAnalyzerController from "../controllers/specAnalyzer.controller";
import codeReviewController from "../controllers/codeReview.controller";

const router: Router = Router();

// =====================================
// Module 1: AI Spec Analyzer
// =====================================
router.post(
  "/analyze-spec",
  specAnalyzerController.analyzeSpec.bind(specAnalyzerController)
);
router.get(
  "/analyze-spec/history",
  specAnalyzerController.getHistory.bind(specAnalyzerController)
);
router.get(
  "/analyze-spec/:id",
  specAnalyzerController.getAnalysisById.bind(specAnalyzerController)
);

// =====================================
// Module 2: AI Code Review Assistant
// =====================================

// Get context info by contextId
router.get(
  "/code-review/context/:contextId",
  codeReviewController.getContext.bind(codeReviewController)
);

// Step 1: Upload project context
router.post(
  "/code-review/upload-context",
  codeReviewController.uploadContext.bind(codeReviewController)
);

// Step 2: Review changes with stored context
router.post(
  "/code-review/review-changes",
  codeReviewController.reviewChanges.bind(codeReviewController)
);

// One-step quick review (codebase + changes together)
router.post(
  "/code-review/quick-review",
  codeReviewController.quickReview.bind(codeReviewController)
);

export default router;
