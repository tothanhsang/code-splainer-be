/**
 * Prompt templates cho Spec Analysis (Phase 1)
 * Centralized prompt management để dễ maintain và version control
 */

export interface SpecAnalysisPromptParams {
  allDocumentNames: string[];
  analysisFocus: string;
  documentSections: string;
}

/**
 * Main prompt template cho multi-document spec analysis
 * Match với prompt_sample.md structure
 */
export const SPEC_ANALYSIS_PROMPT = ({
  allDocumentNames,
  analysisFocus,
  documentSections,
}: SpecAnalysisPromptParams): string => `
Bạn là một Technical Product Manager và Senior Business Analyst, người có khả năng tổng hợp thông tin từ nhiều nguồn tài liệu khác nhau để tạo ra các chỉ dẫn kỹ thuật rõ ràng và đầy đủ.

Nhiệm-vụ của bạn là đọc và phân tích toàn bộ nội dung từ nhiều tài liệu được cung cấp. Ngoài ra, bạn sẽ nhận được một "Trọng tâm Phân tích" (Analysis Focus) từ người dùng. Đây là các chủ đề hoặc phần cụ thể mà người dùng muốn bạn đặc biệt chú ý.

Khi điền vào cấu trúc JSON bên dưới, hãy **ưu-tiên** và **tập-trung** vào việc tìm kiếm và tổng hợp thông tin liên quan đến các chủ đề trong "Trọng tâm Phân tích" để đưa ra câu trả lời sâu sắc và chi tiết nhất có thể.

Hãy trả về kết quả dưới dạng một đối tượng JSON hợp lệ duy nhất, không kèm theo bất kỳ văn bản nào khác. Đối tượng JSON phải có cấu trúc chính xác như sau:

{
  "sourceDocuments": ${JSON.stringify(allDocumentNames)},
  "analysisFocus": "Chép lại chính xác các trọng tâm mà người dùng đã yêu cầu.",
  "featureOverview": {
    "name": "Tên của tính năng.",
    "goal": "Mô tả mục tiêu cuối cùng của tính năng này theo cấu trúc: 'Tính năng này giúp [đối tượng người dùng] có thể [làm gì đó] để [đạt được kết quả gì]'.",
    "summary": "Tóm tắt tổng quan về tính năng."
  },
  "forDevelopers": {
    "userStories": [
      "Liệt kê các User Story chính liên quan đến trọng tâm phân tích."
    ],
    "coreFunctions": [
      "Liệt kê các chức năng kỹ thuật cốt lõi mà hệ thống phải thực hiện, đặc biệt là những chức năng liên quan đến trọng tâm."
    ],
    "dataRequirements": "Mô tả các yêu cầu về dữ liệu liên quan đến trọng tâm: input cần những gì, output trả ra sao, có cần thay đổi cấu trúc database hay không?",
    "technicalNotes": [
      "Liệt kê các lưu ý kỹ thuật quan trọng khác, đặc biệt là những lưu ý tìm thấy trong các phần được yêu cầu tập trung phân tích."
    ]
  },
  "forTesters": {
    "acceptanceCriteria": [
      "Liệt kê các tiêu chí chấp nhận (Acceptance Criteria) quan trọng nhất dưới dạng 'Given/When/Then' liên quan đến trọng tâm."
    ],
    "happyPath": "Mô tả luồng hoạt động thành công chính của người dùng liên quan đến trọng tâm phân tích.",
    "edgeCasesAndRisks": [
      "Dựa vào các phần tài liệu được yêu cầu tập trung, suy luận và liệt kê các trường hợp ngoại lệ (edge cases), các luồng lỗi, hoặc rủi ro tiềm ẩn mà QC cần đặc biệt chú ý."
    ],
    "nonFunctionalRequirements": "Liệt kê các yêu cầu phi chức năng (performance, security,...) được đề cập trong các phần liên quan đến trọng tâm."
  }
}

--- TRỌNG TÂM PHÂN TÍCH ---
${analysisFocus}
--- KẾT THÚC TRỌNG TÂM PHÂN TÍCH ---

--- BẮT ĐẦU NỘI DUNG CÁC TÀI LIỆU ---

${documentSections}

--- KẾT THÚC NỘI DUNG CÁC TÀI LIỆU ---

Chỉ trả về JSON thuần, không thêm markdown hay text giải thích.
`;

/**
 * Helper function để build document sections
 */
export const buildDocumentSections = (
  originDocument: { fileName: string; content: string },
  childDocuments: Array<{ fileName: string; content: string }> = []
): string => {
  let sections = `--- TÀI LIỆU GỐC: ${originDocument.fileName} ---
${originDocument.content}
--- KẾT THÚC TÀI LIỆU GỐC ---`;

  childDocuments.forEach((doc, index) => {
    sections += `

--- TÀI LIỆU CON ${index + 1}: ${doc.fileName} ---
${doc.content}
--- KẾT THÚC TÀI LIỆU CON ${index + 1} ---`;
  });

  return sections;
};

/**
 * Prompt version info
 */
export const PROMPT_VERSION = {
  version: "1.0.0",
  lastUpdated: "2025-01-17",
  description: "Multi-document spec analysis prompt matching prompt_sample.md",
  phase: "Phase 1 - Spec Analyzer",
};
