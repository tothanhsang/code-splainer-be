import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import pdfParserService from "../services/pdfParser.service";
import aiAnalysisService from "../services/aiAnalysis.service";
import prisma from "../config/database";

/**
 * Controller for FSD analysis
 */
export class SpecAnalyzerController {
  /**
   * POST /api/analyze-spec
   * Upload and analyze FSD file
   */
  async analyzeSpec(req: Request, res: Response): Promise<void> {
    try {
      // Check file upload - support multiple files
      if (!req.files || !req.files.origin) {
        res.status(400).json({
          success: false,
          error: "Please upload origin FSD file (field name: origin)",
        });
        return;
      }

      const originFile = req.files.origin as UploadedFile;

      // Get optional child documents
      const childFiles: UploadedFile[] = [];
      if (req.files.children) {
        const children = req.files.children;
        if (Array.isArray(children)) {
          childFiles.push(...children);
        } else {
          childFiles.push(children as UploadedFile);
        }
      }

      // Get optional analysis focus from request body
      const analysisFocus = req.body?.analysisFocus as string | undefined;

      // Validate origin file
      pdfParserService.validatePDF(originFile);

      // Extract text from origin PDF
      console.log(
        `📄 Processing origin file: ${originFile.name} (${originFile.size} bytes)`
      );
      const originText = await pdfParserService.extractText(originFile);
      console.log(
        `✅ Extracted ${originText.length} characters from origin file`
      );

      // Extract text from child PDFs
      const childDocuments: Array<{ fileName: string; content: string }> = [];
      for (const childFile of childFiles) {
        pdfParserService.validatePDF(childFile);
        console.log(
          `📄 Processing child file: ${childFile.name} (${childFile.size} bytes)`
        );
        const childText = await pdfParserService.extractText(childFile);
        console.log(
          `✅ Extracted ${childText.length} characters from child file`
        );
        childDocuments.push({
          fileName: childFile.name,
          content: childText,
        });
      }

      // Analyze with AI using multi-document parameters
      const analysis = await aiAnalysisService.analyzeSpec(
        {
          fileName: originFile.name,
          content: originText,
        },
        childDocuments,
        analysisFocus
      );

      // Save to database with new schema
      const allFileNames = [
        originFile.name,
        ...childDocuments.map((d) => d.fileName),
      ].join(", ");
      const totalSize =
        originFile.size + childFiles.reduce((sum, f) => sum + f.size, 0);

      const savedAnalysis = await prisma.specAnalysis.create({
        data: {
          fileName: allFileNames, // Store all file names
          fileSize: totalSize, // Total size of all files
          analysisFocus: analysisFocus || null,
          analysisResult: analysis as any, // Full advanced analysis
          // Legacy fields for backward compatibility
          overview: analysis.featureOverview.summary,
          userStories: analysis.forDevelopers.userStories,
          features: analysis.forDevelopers.coreFunctions,
          notes: analysis.forDevelopers.technicalNotes,
        },
      });

      // Return advanced result
      res.json({
        success: true,
        data: {
          id: savedAnalysis.id,
          fileName: savedAnalysis.fileName,
          analysisFocus: savedAnalysis.analysisFocus,
          analysis: analysis, // Full advanced analysis
          createdAt: savedAnalysis.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Error analyzing FSD:", error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /api/analyze-spec/history
   * Get analysis history
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const analyses = await prisma.specAnalysis.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          overview: true,
          createdAt: true,
        },
      });

      const total = await prisma.specAnalysis.count();

      res.json({
        success: true,
        data: {
          analyses,
          pagination: {
            total,
            limit,
            offset,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error getting history:", error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /api/analyze-spec/:id
   * Get analysis details by ID
   */
  async getAnalysisById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const analysis = await prisma.specAnalysis.findUnique({
        where: { id },
      });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: "Analysis not found",
        });
        return;
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("❌ Error getting analysis details:", error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new SpecAnalyzerController();
