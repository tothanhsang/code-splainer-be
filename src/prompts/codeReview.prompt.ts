/**
 * Prompt templates cho Code Review (Phase 2)
 * AI Code Review Assistant - Review code changes với context của toàn bộ dự án
 */

export interface CodeReviewPromptParams {
  projectContext: string;
  changesContent: string;
  changeDescription: string;
}

/**
 * Main prompt template cho code review
 * Dựa trên prompt_phase_2.md
 */
export const CODE_REVIEW_PROMPT = ({
  projectContext,
  changesContent,
  changeDescription,
}: CodeReviewPromptParams): string => `
Bạn là một Tech Lead với 10 năm kinh nghiệm. Dưới đây là **ngữ cảnh của toàn bộ dự án** và một **file diff chứa các thay đổi** cho một tính năng mới. 

Dựa trên sự hiểu biết sâu sắc về toàn bộ dự án, hãy review các thay đổi này.

--- MÔ TẢ THAY ĐỔI ---
${changeDescription}
--- KẾT THÚC MÔ TẢ ---

--- NGỮ CẢNH TOÀN BỘ DỰ ÁN ---
${projectContext}
--- KẾT THÚC NGỮ CẢNH ---

--- NỘI DUNG THAY ĐỔI (DIFF) ---
${changesContent}
--- KẾT THÚC THAY ĐỔI ---

Hãy trả về một đối tượng JSON với cấu trúc sau (KHÔNG thêm markdown code block, chỉ trả về JSON thuần):

{
  "overallQuality": "Đánh giá tổng quan về chất lượng thay đổi (1-2 câu)",
  "summary": {
    "totalIssues": <số lượng vấn đề tìm thấy>,
    "criticalIssues": <số lượng vấn đề nghiêm trọng>,
    "filesReviewed": <số lượng file được review>
  },
  "potentialBugs": [
    {
      "file": "tên file",
      "line": <số dòng nếu xác định được, hoặc null nếu không xác định>,
      "severity": "critical|high|medium|low",
      "issue": "Mô tả lỗi tiềm ẩn",
      "suggestion": "Gợi ý sửa lỗi"
    }
  ],
  "performanceIssues": [
    {
      "file": "tên file",
      "line": <số dòng nếu xác định được, hoặc null nếu không xác định>,
      "severity": "critical|high|medium|low",
      "issue": "Mô tả vấn đề hiệu năng",
      "suggestion": "Gợi ý tối ưu"
    }
  ],
  "securityVulnerabilities": [
    {
      "file": "tên file",
      "line": <số dòng nếu xác định được, hoặc null nếu không xác định>,
      "severity": "critical|high|medium|low",
      "issue": "Mô tả lỗ hổng bảo mật",
      "suggestion": "Gợi ý khắc phục"
    }
  ],
  "conventionViolations": [
    {
      "file": "tên file",
      "line": <số dòng nếu xác định được, hoặc null nếu không xác định>,
      "severity": "critical|high|medium|low",
      "issue": "Mô tả vi phạm convention",
      "suggestion": "Gợi ý tuân thủ"
    }
  ],
  "improvements": [
    {
      "file": "tên file",
      "line": <số dòng nếu xác định được, hoặc null nếu không xác định>,
      "type": "refactoring|optimization|best-practice",
      "suggestion": "Gợi ý cải thiện code"
    }
  ],
  "positivePoints": [
    "Điểm tốt 1",
    "Điểm tốt 2"
  ]
}

Yêu cầu:
1. **Lỗi logic tiềm ẩn (Potential Bugs):** Có trường hợp nào mà thay đổi này có thể gây ra lỗi không?
2. **Vấn đề hiệu năng (Performance Issues):** Có câu lệnh query nào chậm, vòng lặp nào không tối ưu không?
3. **Lỗ hổng bảo mật (Security Vulnerabilities):** Có nguy cơ SQL injection, XSS, hoặc xử lý dữ liệu nhạy cảm không an toàn không?
4. **Tuân thủ Convention (Convention Compliance):** Các thay đổi này có tuân thủ coding style và các pattern chung của dự án không?
5. **Gợi ý cải thiện (Suggestions for Improvement):** Có cách nào để viết lại code cho sạch hơn, dễ bảo trì hơn không?

Lưu ý:
- Hãy cụ thể về file và dòng code (nếu xác định được)
- Nếu không xác định được dòng code cụ thể, đặt "line": null
- Phân loại severity rõ ràng
- Đưa ra suggestions thực tế và có thể áp dụng
- Cũng nên khen ngợi những điểm tốt trong code
`;

/**
 * Helper function để build project context từ nhiều files
 */
export const buildProjectContext = (
  files: Array<{ path: string; content: string }>
): string => {
  let context = "";

  files.forEach((file) => {
    context += `\n--- FILE: ${file.path} ---\n`;
    context += file.content;
    context += `\n--- END FILE: ${file.path} ---\n`;
  });

  return context;
};

/**
 * Helper function để build changes content từ diff hoặc changed files
 */
export const buildChangesContent = (
  changes: Array<{ path: string; content: string; isDiff?: boolean }>
): string => {
  let content = "";

  changes.forEach((change) => {
    if (change.isDiff) {
      content += `\n--- DIFF ---\n`;
      content += change.content;
      content += `\n--- END DIFF ---\n`;
    } else {
      content += `\n--- CHANGED FILE: ${change.path} ---\n`;
      content += change.content;
      content += `\n--- END CHANGED FILE: ${change.path} ---\n`;
    }
  });

  return content;
};

/**
 * Prompt version info
 */
export const PROMPT_VERSION = {
  version: "1.0.0",
  lastUpdated: "2025-01-17",
  description: "AI Code Review Assistant prompt",
  phase: "Phase 2 - Code Review",
  status: "Active",
};
