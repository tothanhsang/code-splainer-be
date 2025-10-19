import { UploadedFile } from "express-fileupload";

/**
 * Service to handle and extract text from PDF files
 */
export class PDFParserService {
  /**
   * Extract text from PDF file
   * @param file - Uploaded PDF file
   * @returns Text content from PDF
   */
  async extractText(file: UploadedFile): Promise<string> {
    let parser: any = null;

    try {
      // Import pdf-parse v2 - uses PDFParse class
      const { PDFParse } = require("pdf-parse");
      const fs = require("fs");

      // Get buffer data - handle both useTempFiles true/false
      let dataBuffer: Buffer;

      if (file.tempFilePath) {
        // File is stored in temp directory
        dataBuffer = fs.readFileSync(file.tempFilePath);
      } else if (file.data) {
        // File is in memory
        dataBuffer = file.data;
      } else {
        throw new Error("Cannot read file data");
      }

      // Validate buffer
      if (!dataBuffer || dataBuffer.length === 0) {
        throw new Error("PDF file is empty or invalid");
      }

      console.log(`📄 PDF buffer size: ${dataBuffer.length} bytes`);

      // Create parser instance
      parser = new PDFParse({ data: dataBuffer });

      // Extract text using getText() method
      const result = await parser.getText();
      const text = result.text;

      if (!text || text.trim().length === 0) {
        throw new Error(
          "PDF file does not contain text or text cannot be read"
        );
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error parsing PDF: ${error.message}`);
      }
      throw new Error("Unknown error while parsing PDF");
    } finally {
      // Clean up parser resources
      if (parser) {
        try {
          await parser.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Validate PDF file
   * @param file - Uploaded file
   */
  validatePDF(file: UploadedFile): void {
    // Check if file exists
    if (!file) {
      throw new Error("File not found");
    }

    // Check MIME type
    if (file.mimetype !== "application/pdf") {
      throw new Error("File must be in PDF format");
    }

    // Check file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB
    if (file.size > maxSize) {
      throw new Error(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      );
    }
  }
}

export default new PDFParserService();
