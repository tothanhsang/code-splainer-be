import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import zipParserService from "../services/zipParser.service";
import codeReviewService from "../services/codeReview.service";

/**
 * Controller for Phase 2 - Code Review Assistant
 * Handles 2-step process: Upload context → Review changes
 */
export class CodeReviewController {
  /**
   * GET /api/code-review/context/:contextId
   * Get context information by contextId
   */
  async getContext(req: Request, res: Response): Promise<void> {
    try {
      const { contextId } = req.params;

      if (!contextId) {
        res.status(400).json({
          success: false,
          error: "Missing contextId parameter",
        });
        return;
      }

      console.log(`🔍 Retrieving context info: ${contextId}`);

      const contextInfo = await codeReviewService.getContextInfo(contextId);

      if (!contextInfo) {
        res.status(404).json({
          success: false,
          error: "Context not found or expired",
        });
        return;
      }

      res.json({
        success: true,
        data: contextInfo,
      });
    } catch (error) {
      console.error("❌ Error in getContext:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get context",
      });
    }
  }

  /**
   * POST /api/code-review/upload-context
   * Step 1: Upload entire codebase for AI to learn
   */
  async uploadContext(req: Request, res: Response): Promise<void> {
    try {
      // =====================================
      // 1. VALIDATE REQUEST
      // =====================================

      if (!req.files || !req.files.codebase) {
        res.status(400).json({
          success: false,
          error: "Please upload codebase file (.zip)",
        });
        return;
      }

      const codebaseFile = req.files.codebase as UploadedFile;

      // =====================================
      // 2. VALIDATE ZIP FILE
      // =====================================

      try {
        zipParserService.validateZip(codebaseFile);
      } catch (error) {
        res.status(400).json({
          success: false,
          error:
            error instanceof Error ? error.message : "File validation failed",
        });
        return;
      }

      // =====================================
      // 3. EXTRACT FILES FROM ZIP
      // =====================================

      console.log(`📦 Extracting codebase: ${codebaseFile.name}`);

      const projectFiles = await zipParserService.extractAllFiles(codebaseFile);
      const stats = zipParserService.getFileStats(projectFiles);

      console.log(
        `✅ Extracted ${stats.totalFiles} files (${stats.totalLines} lines)`
      );

      // =====================================
      // 4. STORE PROJECT CONTEXT
      // =====================================

      console.log("💾 Storing project context...");

      const contextId = await codeReviewService.storeProjectContext(
        projectFiles
      );

      console.log(`✅ Context stored with ID: ${contextId}`);

      // =====================================
      // 5. RETURN RESPONSE
      // =====================================

      res.json({
        success: true,
        data: {
          contextId,
          stats: {
            totalFiles: stats.totalFiles,
            totalLines: stats.totalLines,
            filesByExtension: stats.filesByExtension,
          },
          message:
            "Project context uploaded successfully. You can now submit code changes for review.",
        },
      });
    } catch (error) {
      console.error("❌ Error in uploadContext:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload context",
      });
    }
  }

  /**
   * POST /api/code-review/review-changes
   * Step 2: Upload changes and receive AI review
   */
  async reviewChanges(req: Request, res: Response): Promise<void> {
    try {
      // =====================================
      // 1. VALIDATE REQUEST
      // =====================================

      const { contextId, changeDescription } = req.body;

      if (!contextId) {
        res.status(400).json({
          success: false,
          error: "Missing contextId. Please upload project context first.",
        });
        return;
      }

      if (!changeDescription) {
        res.status(400).json({
          success: false,
          error: "Please provide a change description",
        });
        return;
      }

      if (!req.files || !req.files.changes) {
        res.status(400).json({
          success: false,
          error: "Please upload changes file (.zip or .patch)",
        });
        return;
      }

      const changesFile = req.files.changes as UploadedFile;

      // =====================================
      // 2. RETRIEVE PROJECT CONTEXT
      // =====================================

      console.log(`🔍 Retrieving project context: ${contextId}`);

      const projectContext = await codeReviewService.getProjectContext(
        contextId
      );

      if (!projectContext) {
        res.status(404).json({
          success: false,
          error:
            "Project context not found or expired. Please upload codebase again.",
        });
        return;
      }

      console.log("✅ Project context retrieved");

      // =====================================
      // 3. EXTRACT CHANGES
      // =====================================

      console.log(`📝 Processing changes: ${changesFile.name}`);

      let changedFiles: Array<{
        path: string;
        content: string;
        isDiff?: boolean;
      }> = [];

      // Check if it's a diff/patch file
      if (
        changesFile.name.endsWith(".patch") ||
        changesFile.name.endsWith(".diff")
      ) {
        const diffContent = changesFile.data.toString("utf8");
        const parsedDiffs = zipParserService.parseDiffFile(diffContent);

        changedFiles = parsedDiffs.map((diff) => ({
          path: diff.file,
          content: diff.changes,
          isDiff: true,
        }));

        console.log(`✅ Parsed ${changedFiles.length} files from diff`);
      } else {
        // It's a ZIP file with changed files
        zipParserService.validateZip(changesFile);
        const extractedFiles = await zipParserService.extractAllFiles(
          changesFile
        );

        changedFiles = extractedFiles.map((file) => ({
          path: file.path,
          content: file.content,
          isDiff: false,
        }));

        console.log(`✅ Extracted ${changedFiles.length} changed files`);
      }

      if (changedFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: "No valid changes found in the uploaded file",
        });
        return;
      }

      // =====================================
      // 4. RUN AI CODE REVIEW
      // =====================================

      console.log("🤖 Starting AI code review...");
      console.log(`📝 Description: ${changeDescription}`);

      const review = await codeReviewService.reviewWithStoredContext(
        projectContext,
        changedFiles,
        changeDescription
      );

      const stats = codeReviewService.getReviewStats(review);

      console.log("✅ Code review complete");

      // =====================================
      // 5. RETURN RESPONSE
      // =====================================

      res.json({
        success: true,
        data: {
          review,
          stats,
          filesReviewed: changedFiles.map((f) => f.path),
        },
      });
    } catch (error) {
      console.error("❌ Error in reviewChanges:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Code review failed",
      });
    }
  }

  /**
   * POST /api/code-review/quick-review
   * One-step review: Upload codebase + changes together
   * For simple use cases
   */
  async quickReview(req: Request, res: Response): Promise<void> {
    try {
      // =====================================
      // 1. VALIDATE REQUEST
      // =====================================

      const { changeDescription } = req.body;

      if (!changeDescription) {
        res.status(400).json({
          success: false,
          error: "Please provide a change description",
        });
        return;
      }

      if (!req.files || !req.files.codebase || !req.files.changes) {
        res.status(400).json({
          success: false,
          error: "Please upload both codebase and changes files",
        });
        return;
      }

      const codebaseFile = req.files.codebase as UploadedFile;
      const changesFile = req.files.changes as UploadedFile;

      // =====================================
      // 2. EXTRACT CODEBASE
      // =====================================

      console.log("📦 Extracting codebase...");
      zipParserService.validateZip(codebaseFile);
      const projectFiles = await zipParserService.extractAllFiles(codebaseFile);
      console.log(`✅ Extracted ${projectFiles.length} project files`);

      // =====================================
      // 3. EXTRACT CHANGES
      // =====================================

      console.log("📝 Extracting changes...");
      let changedFiles: Array<{
        path: string;
        content: string;
        isDiff?: boolean;
      }> = [];

      if (
        changesFile.name.endsWith(".patch") ||
        changesFile.name.endsWith(".diff")
      ) {
        const diffContent = changesFile.data.toString("utf8");
        const parsedDiffs = zipParserService.parseDiffFile(diffContent);
        changedFiles = parsedDiffs.map((diff) => ({
          path: diff.file,
          content: diff.changes,
          isDiff: true,
        }));
      } else {
        zipParserService.validateZip(changesFile);
        const extractedFiles = await zipParserService.extractAllFiles(
          changesFile
        );
        changedFiles = extractedFiles.map((file) => ({
          path: file.path,
          content: file.content,
          isDiff: false,
        }));
      }

      console.log(`✅ Extracted ${changedFiles.length} changed files`);

      // =====================================
      // 4. RUN AI CODE REVIEW
      // =====================================

      console.log("🤖 Starting AI code review...");

      const review = await codeReviewService.reviewCode(
        projectFiles,
        changedFiles,
        changeDescription
      );

      const stats = codeReviewService.getReviewStats(review);

      console.log("✅ Code review complete");

      // =====================================
      // 5. RETURN RESPONSE
      // =====================================

      res.json({
        success: true,
        data: {
          review,
          stats,
          projectStats: zipParserService.getFileStats(projectFiles),
          filesReviewed: changedFiles.map((f) => f.path),
        },
      });
    } catch (error) {
      console.error("❌ Error in quickReview:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Quick review failed",
      });
    }
  }
}

export default new CodeReviewController();
