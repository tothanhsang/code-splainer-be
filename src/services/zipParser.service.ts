import { UploadedFile } from "express-fileupload";
import AdmZip from "adm-zip";
import path from "path";

/**
 * Service to handle and extract content from ZIP files
 * Supports Phase 2 - Code Review Assistant
 */
export class ZipParserService {
  /**
   * Validate ZIP file before parsing
   */
  validateZip(file: UploadedFile): void {
    // Check file exists
    if (!file) {
      throw new Error("File not found");
    }

    // Check MIME type
    const validMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip",
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      throw new Error("File must be in ZIP format");
    }

    // Check file size (max 50MB for codebase)
    const maxSize = parseInt(process.env.MAX_ZIP_SIZE || "52428800"); // 50MB
    if (file.size > maxSize) {
      throw new Error(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Extract all files from ZIP
   * Returns array of {path, content}
   */
  async extractAllFiles(
    file: UploadedFile
  ): Promise<Array<{ path: string; content: string }>> {
    try {
      const zip = new AdmZip(file.data);
      const zipEntries = zip.getEntries();

      const files: Array<{ path: string; content: string }> = [];

      for (const entry of zipEntries) {
        // Skip directories
        if (entry.isDirectory) {
          continue;
        }

        // Skip binary files and common non-code files
        if (this.shouldSkipFile(entry.entryName)) {
          continue;
        }

        try {
          const content = entry.getData().toString("utf8");
          files.push({
            path: entry.entryName,
            content: content,
          });
        } catch (error) {
          // Skip files that can't be read as text
          console.warn(`Skipping binary file: ${entry.entryName}`);
          continue;
        }
      }

      if (files.length === 0) {
        throw new Error("ZIP file does not contain any readable code files");
      }

      return files;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error parsing ZIP: ${error.message}`);
      }
      throw new Error("Unknown error while parsing ZIP");
    }
  }

  /**
   * Extract specific files by pattern (for changes)
   */
  async extractFilesByPattern(
    file: UploadedFile,
    pattern?: RegExp
  ): Promise<Array<{ path: string; content: string }>> {
    const allFiles = await this.extractAllFiles(file);

    if (!pattern) {
      return allFiles;
    }

    return allFiles.filter((f) => pattern.test(f.path));
  }

  /**
   * Check if file should be skipped (binary, images, etc.)
   */
  private shouldSkipFile(filename: string): boolean {
    const skipExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".svg",
      ".ico",
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".zip",
      ".tar",
      ".gz",
      ".rar",
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      ".mp3",
      ".mp4",
      ".avi",
      ".mov",
      ".ttf",
      ".woff",
      ".woff2",
      ".eot",
    ];

    const skipDirs = [
      "node_modules/",
      ".git/",
      "dist/",
      "build/",
      "coverage/",
      ".next/",
      ".nuxt/",
      "vendor/",
      "__pycache__/",
    ];

    // Check extensions
    const ext = path.extname(filename).toLowerCase();
    if (skipExtensions.includes(ext)) {
      return true;
    }

    // Check directories
    for (const dir of skipDirs) {
      if (filename.includes(dir)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse diff/patch file content
   */
  parseDiffFile(content: string): Array<{ file: string; changes: string }> {
    const diffs: Array<{ file: string; changes: string }> = [];
    const lines = content.split("\n");

    let currentFile = "";
    let currentChanges: string[] = [];

    for (const line of lines) {
      // Detect file header in diff
      if (
        line.startsWith("diff --git") ||
        line.startsWith("---") ||
        line.startsWith("+++")
      ) {
        if (currentFile && currentChanges.length > 0) {
          diffs.push({
            file: currentFile,
            changes: currentChanges.join("\n"),
          });
          currentChanges = [];
        }

        // Extract filename
        if (line.startsWith("+++")) {
          currentFile = line.replace("+++ b/", "").trim();
        }
      } else {
        currentChanges.push(line);
      }
    }

    // Add last file
    if (currentFile && currentChanges.length > 0) {
      diffs.push({
        file: currentFile,
        changes: currentChanges.join("\n"),
      });
    }

    return diffs;
  }

  /**
   * Get file statistics
   */
  getFileStats(files: Array<{ path: string; content: string }>): {
    totalFiles: number;
    totalLines: number;
    filesByExtension: Record<string, number>;
  } {
    const filesByExtension: Record<string, number> = {};
    let totalLines = 0;

    files.forEach((file) => {
      const ext = path.extname(file.path) || "no-extension";
      filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
      totalLines += file.content.split("\n").length;
    });

    return {
      totalFiles: files.length,
      totalLines,
      filesByExtension,
    };
  }
}

export default new ZipParserService();
