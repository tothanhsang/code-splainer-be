# 🔍 Phase 2: AI Code Review Assistant

## 🎯 Overview

AI Code Review Assistant giúp Tech Lead và developers thực hiện code review tự động với sự hiểu biết sâu sắc về toàn bộ codebase.

### Key Features

✅ **Context-Aware Review** - AI hiểu toàn bộ project structure và conventions  
✅ **Bug Detection** - Phát hiện lỗi logic tiềm ẩn  
✅ **Performance Analysis** - Tìm các vấn đề về hiệu năng  
✅ **Security Check** - Phát hiện lỗ hổng bảo mật  
✅ **Convention Compliance** - Kiểm tra tuân thủ coding style  
✅ **Improvement Suggestions** - Gợi ý cải thiện code quality  

---

## 🚀 Quick Start

### 1. Start Server

```bash
cd code-splainer-be
pnpm install
pnpm dev
```

### 2. Upload Project Context

```bash
# Prepare your codebase
zip -r my-project.zip . -x "node_modules/*" ".git/*" "dist/*"

# Upload to AI
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@my-project.zip"

# Save the contextId from response
```

### 3. Review Your Changes

```bash
# Create diff file
git diff > my-changes.patch

# Get AI review
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_CONTEXT_ID" \
  -F "changeDescription=Fixed authentication bug" \
  -F "changes=@my-changes.patch"
```

---

## 🏭 Code Structure

```
src/
├── config/
│   ├── database.ts          # Prisma client (Phase 1 only)
│   ├── redis.ts             # Redis client for context storage
│   └── gemini.ts            # Genkit + Gemini AI (gemini-2.5-pro)
├── controllers/
│   ├── specAnalyzer.controller.ts  # Phase 1 controller
│   └── codeReview.controller.ts    # Phase 2 controller ⭐
├── services/
│   ├── pdfParser.service.ts        # Phase 1 PDF parsing
│   ├── aiAnalysis.service.ts       # Phase 1 AI analysis
│   ├── zipParser.service.ts        # Phase 2 ZIP parsing ⭐
│   └── codeReview.service.ts       # Phase 2 AI review ⭐
├── prompts/
│   ├── specAnalysis.prompt.ts      # Phase 1 prompts
│   └── codeReview.prompt.ts        # Phase 2 prompts ⭐
├── routes/
│   └── api.routes.ts               # All API routes
└── server.ts                       # Express server
```

**Phase 2 Files (⭐):**
- `codeReview.controller.ts` - 404 lines - HTTP request handling
- `codeReview.service.ts` - 381 lines - Business logic & AI integration
- `zipParser.service.ts` - ~200 lines - ZIP/PATCH file parsing
- `codeReview.prompt.ts` - 161 lines - Centralized prompt templates

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2 Architecture                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       │ 1. Upload codebase.zip
       ↓
┌──────────────────────┐
│  Controller          │
│  codeReview.controller│
└──────┬───────────────┘
       │
       │ 2. Extract files
       ↓
┌──────────────────────┐
│  ZIP Parser Service  │
│  zipParser.service   │
└──────┬───────────────┘
       │
       │ 3. Store context
       ↓
┌──────────────────────┐
│  Code Review Service │
│  codeReview.service  │
└──────┬───────────────┘
       │
       │ 4. Store in Redis
       ↓
┌──────────────────────┐
│      Redis           │
│  (Context Storage)   │
└──────────────────────┘

       ┌─────────────────┐
       │ Client uploads  │
       │ changes.patch   │
       └────────┬────────┘
                │
                │ 5. Review request
                ↓
       ┌────────────────────┐
       │  Controller        │
       └────────┬───────────┘
                │
                │ 6. Get context
                ↓
       ┌────────────────────┐
       │  Redis             │
       └────────┬───────────┘
                │
                │ 7. Build prompt
                ↓
       ┌────────────────────┐
       │  Prompt Template   │
       │  codeReview.prompt │
       └────────┬───────────┘
                │
                │ 8. AI Review
                ↓
       ┌────────────────────┐
       │  Genkit + Gemini   │
       └────────┬───────────┘
                │
                │ 9. Structured output
                ↓
       ┌────────────────────┐
       │  Review Result     │
       │  (JSON)            │
       └────────────────────┘
```

---

## 📁 File Structure

```
src/
├── prompts/
│   └── codeReview.prompt.ts      # Centralized prompt template
├── services/
│   ├── zipParser.service.ts      # ZIP file extraction
│   └── codeReview.service.ts     # AI review logic
├── controllers/
│   └── codeReview.controller.ts  # HTTP endpoints
└── routes/
    └── api.routes.ts              # API routing
```

---

## 🔧 Implementation Details

### 1. Prompt Template (`codeReview.prompt.ts`)

```typescript
export const CODE_REVIEW_PROMPT = ({
  projectContext,
  changesContent,
  changeDescription,
}: CodeReviewPromptParams): string => `
Bạn là một Tech Lead với 10 năm kinh nghiệm...

--- NGỮ CẢNH TOÀN BỘ DỰ ÁN ---
${projectContext}
--- KẾT THÚC NGỮ CẢNH ---

--- NỘI DUNG THAY ĐỔI (DIFF) ---
${changesContent}
--- KẾT THÚC THAY ĐỔI ---

Trả về JSON với:
- potentialBugs
- performanceIssues
- securityVulnerabilities
- conventionViolations
- improvements
`;
```

### 2. ZIP Parser Service

```typescript
class ZipParserService {
  // Extract all text files from ZIP
  async extractAllFiles(file: UploadedFile): Promise<Array<{path, content}>>
  
  // Parse diff/patch files
  parseDiffFile(content: string): Array<{file, changes}>
  
  // Skip binary files and build directories
  private shouldSkipFile(filename: string): boolean
}
```

### 3. Code Review Service

```typescript
class CodeReviewService {
  // Main review method
  async reviewCode(
    projectFiles: Array<{path, content}>,
    changedFiles: Array<{path, content, isDiff}>,
    changeDescription: string
  ): Promise<CodeReviewResult>
  
  // Store/retrieve context from Redis
  async storeProjectContext(files): Promise<contextId>
  async getProjectContext(contextId): Promise<context>
}
```

### 4. Genkit Flow

```typescript
export const codeReviewFlow = ai.defineFlow(
  {
    name: 'codeReview',
    inputSchema: CodeReviewInput,
    outputSchema: CodeReviewSchema, // Zod validation
  },
  async ({ projectContext, changesContent, changeDescription }) => {
    const prompt = CODE_REVIEW_PROMPT({...});
    const llmResponse = await ai.generate(prompt);
    return CodeReviewSchema.parse(JSON.parse(llmResponse.text));
  }
);
```

---

## 🎯 API Endpoints

### 1. Upload Context
```
POST /api/code-review/upload-context
Body: codebase (ZIP file)
Response: { contextId, stats }
```

### 2. Review Changes
```
POST /api/code-review/review-changes
Body: contextId, changeDescription, changes (ZIP or .patch)
Response: { review, stats, filesReviewed }
```

### 3. Quick Review
```
POST /api/code-review/quick-review
Body: codebase (ZIP), changes (ZIP or .patch), changeDescription
Response: { review, stats, projectStats }
```

---

## 📊 Review Output Example

```json
{
  "overallQuality": "Code changes are good with minor issues",
  "summary": {
    "totalIssues": 5,
    "criticalIssues": 1,
    "filesReviewed": 3
  },
  "potentialBugs": [
    {
      "file": "src/cart.service.ts",
      "line": 45,
      "severity": "high",
      "issue": "Potential null pointer exception",
      "suggestion": "Add null check"
    }
  ],
  "performanceIssues": [...],
  "securityVulnerabilities": [...],
  "conventionViolations": [...],
  "improvements": [...],
  "positivePoints": [
    "Good error handling",
    "Well-structured code"
  ]
}
```

---

## 🧪 Testing

### Test Upload Context

```bash
# Create test project
mkdir test-project
cd test-project
echo "function hello() { console.log('Hello'); }" > index.js
zip -r ../test-project.zip .

# Upload
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@test-project.zip"
```

### Test Review Changes

```bash
# Create changes
echo "function hello() { console.log('Hi'); }" > index.js
git diff > changes.patch

# Review
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_ID" \
  -F "changeDescription=Updated greeting" \
  -F "changes=@changes.patch"
```

---

## 💡 Best Practices

### 1. Codebase Preparation

```bash
# Good: Exclude unnecessary files
zip -r codebase.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "build/*"

# Bad: Include everything
zip -r codebase.zip .
```

### 2. Change Description

**Good:**
```
"Added user authentication with JWT. 
Implemented login/logout endpoints.
Used bcrypt for password hashing."
```

**Bad:**
```
"Updated files"
```

### 3. Diff Format

```bash
# Use standard Git diff
git diff > changes.patch

# Or specific files
git diff -- src/auth.ts src/user.ts > changes.patch
```

---

## 🔍 Review Categories

### 1. Potential Bugs
- Null pointer exceptions
- Undefined variables
- Logic errors
- Edge cases not handled

### 2. Performance Issues
- N+1 queries
- Inefficient loops
- Memory leaks
- Slow algorithms

### 3. Security Vulnerabilities
- SQL injection
- XSS attacks
- Insecure data handling
- Missing authentication

### 4. Convention Violations
- Naming conventions
- Code style
- Project patterns
- Best practices

### 5. Improvements
- Refactoring suggestions
- Code simplification
- Better abstractions
- Maintainability tips

---

## 🚀 Deployment

### Environment Variables

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key

# Optional
MAX_ZIP_SIZE=52428800  # 50MB
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Production Checklist

- [ ] Set appropriate MAX_ZIP_SIZE
- [ ] Configure Redis for context storage
- [ ] Set up monitoring for AI API calls
- [ ] Implement rate limiting
- [ ] Add authentication if needed

---

## 📚 Documentation

- [API Documentation](./docs/PHASE2-API.md)
- [Phase 1 Guide](./docs/04-phase1-guide.md)
- [Genkit Guide](./docs/05-genkit-guide.md)

---

## 🎉 Summary

Phase 2 provides powerful AI-powered code review capabilities:

✅ **Context-aware** - Understands entire project  
✅ **Comprehensive** - Checks bugs, performance, security, conventions  
✅ **Actionable** - Provides specific suggestions  
✅ **Fast** - Cached results for repeated reviews  
✅ **Flexible** - Two-step or one-step workflow  

Ready to improve your code quality! 🚀
