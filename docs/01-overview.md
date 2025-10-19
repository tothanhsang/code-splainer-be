# 📖 Tổng quan dự án DevInsight AI - Backend

## 🎯 Giới thiệu

**DevInsight AI Backend** là hệ thống API phục vụ cho ứng dụng DevInsight AI - một trợ lý AI toàn diện giúp developers phân tích tài liệu và tự động tạo documentation.

### Mục tiêu chính

1. **Phase 1 - AI Spec Analyzer**: Phân tích nhiều file FSD (Functional Specification Document) cùng lúc và tự động tạo advanced analysis cho Developers và Testers
2. **Phase 2 - AI Code Review Assistant**: Review code changes với AI trong context của toàn bộ codebase, phát hiện bugs, performance issues, security vulnerabilities

## 🏗️ Kiến trúc tổng thể

### High-Level Architecture

```mermaid
graph TB
    Client[Client/Frontend] -->|HTTP Request| API[Express API Server]
    API -->|Upload PDF| Parser[PDF Parser Service]
    API -->|Upload ZIP| ZipParser[ZIP Parser Service]
    
    Parser -->|Extract Text| AI[AI Analysis Service]
    ZipParser -->|Extract Code| AI
    
    AI -->|Genkit Flow| Genkit[Firebase Genkit]
    Genkit -->|AI Request| Gemini[Google Gemini AI]
    
    AI -->|Save Result| DB[(PostgreSQL)]
    AI -->|Check/Set Cache| Cache[(Redis)]
    
    DB -->|Read History| API
    Cache -->|Get Cached| API
```

## 📊 Phase 1: AI Spec Analyzer - Flow Diagram

### Chi tiết luồng xử lý FSD

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant PDFParser
    participant AIService
    participant Genkit
    participant GeminiAI
    participant Database
    participant Redis
    
    Client->>Controller: POST /api/analyze-spec (origin + children PDFs)
    
    Controller->>Controller: Validate request
    Note over Controller: Check origin exists, validate all PDFs, get analysis focus
    
    Controller->>PDFParser: extractText(origin + children)
    PDFParser->>PDFParser: Parse all PDF buffers
    PDFParser-->>Controller: Return all text content
    
    Controller->>Redis: Check cache (MD5 hash of ALL content)
    alt Cache Hit
        Redis-->>Controller: Return cached analysis
        Controller-->>Client: Return result (cached)
    else Cache Miss
        Controller->>AIService: analyzeSpec(origin, children, focus)
        
        AIService->>Genkit: Run analyzeSpecFlow
        Note over Genkit: Define flow with Zod schema
        
        Genkit->>GeminiAI: generate() with prompt
        Note over GeminiAI: Gemini 1.5 Flash<br/>Temperature: 0.3<br/>Max tokens: 2048
        
        GeminiAI-->>Genkit: Structured JSON response
        Note over Genkit: Auto-validate with Zod schema
        
        Genkit-->>AIService: Validated analysis result
        
        AIService->>Database: Save analysis
        Database-->>AIService: Return saved record
        
        AIService->>Redis: Cache result (1 hour TTL)
        
        AIService-->>Controller: Return analysis
        Controller-->>Client: Return result (200 OK)
    end
```

### Cấu trúc dữ liệu (Advanced)

```mermaid
graph LR
    A[Multiple PDFs] -->|Extract| B[Combined Text]
    B -->|Centralized Prompt| C[Gemini AI]
    C -->|Generate| D{Advanced Structured Output}
    
    D --> E[Feature Overview<br/>name, goal, summary]
    D --> F[For Developers<br/>userStories, coreFunctions,<br/>dataRequirements, technicalNotes]
    D --> G[For Testers<br/>acceptanceCriteria, happyPath,<br/>edgeCases, NFRs]
    
    E --> H[(Database)]
    F --> H
    G --> H
```

## 🔄 Cách API hoạt động

### 1. Request Flow

```
Client Request
    ↓
Express Middleware (CORS, body-parser, file-upload)
    ↓
Router (/api/analyze-spec)
    ↓
Controller (specAnalyzer.controller.ts)
    ↓
Service Layer (pdfParser + aiAnalysis)
    ↓
Genkit Flow (with Gemini AI)
    ↓
Database (PostgreSQL) + Cache (Redis)
    ↓
Response to Client
```

### 2. Validation Pipeline

```mermaid
graph TD
    A[Incoming Request] --> B{File exists?}
    B -->|No| C[400 Error]
    B -->|Yes| D{MIME type = PDF?}
    D -->|No| C
    D -->|Yes| E{Size < 10MB?}
    E -->|No| C
    E -->|Yes| F[Parse PDF]
    F --> G{Text extracted?}
    G -->|No| H[500 Error]
    G -->|Yes| I{Text not empty?}
    I -->|No| H
    I -->|Yes| J[Send to AI]
```

### 3. AI Processing Flow

```mermaid
graph LR
    A[FSD Text] --> B[Create Prompt]
    B --> C[Genkit Flow]
    C --> D[Zod Input Schema<br/>Validation]
    D --> E[Generate with<br/>Gemini AI]
    E --> F[Zod Output Schema<br/>Validation]
    F -->|Success| G[Return Result]
    F -->|Fail| H[Retry or Error]
```

### 4. Caching Strategy

```mermaid
graph TD
    A[Request] --> B[Generate MD5 Hash<br/>from PDF content]
    B --> C{Check Redis Cache}
    C -->|Hit| D[Return Cached Result<br/>⚡ Fast!]
    C -->|Miss| E[Process with AI<br/>🤖 Slower]
    E --> F[Save to Cache<br/>TTL: 1 hour]
    F --> G[Return Result]
```

## 📦 Database Schema

### Phase 1: PostgreSQL (Prisma)

```prisma
model SpecAnalysis {
  id               String   @id @default(uuid())
  fileName         String
  fileSize         Int
  analysisFocus    String?  @db.Text
  analysisResult   Json?    // Main analysis data
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("spec_analyses")
}
```

### Phase 2: Redis Only

- **Context Storage:** `project_context:{contextId}` - TTL 24h
- **Metadata:** `project_context_meta:{contextId}` - TTL 24h
- **Review Cache:** `code_review:{hash}` - TTL 1h

## 🎯 API Endpoints

### Module 1: AI Spec Analyzer

#### 1. Phân tích FSD (Multi-document)
```http
POST /api/analyze-spec
Content-Type: multipart/form-data

Body:
- origin: File PDF gốc (required, max 10MB)
- children: File(s) PDF con (optional, multiple files)
- analysisFocus: Trọng tâm phân tích (optional, string)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "main-spec.pdf, api-spec.pdf",
    "analysisFocus": "Authentication and security",
    "analysis": {
      "featureOverview": {
        "name": "User Authentication System",
        "goal": "Help users login securely",
        "summary": "JWT-based authentication with RBAC"
      },
      "forDevelopers": {
        "userStories": ["As user, I want to login..."],
        "coreFunctions": ["Implement JWT auth", "Create login/logout endpoints"],
        "dataRequirements": "Input: email, password. Output: JWT token",
        "technicalNotes": ["Use bcrypt for password hashing"]
      },
      "forTesters": {
        "acceptanceCriteria": ["Given valid credentials, return JWT token"],
        "happyPath": "User login → Validate → Generate JWT → Return token",
        "edgeCasesAndRisks": ["Weak password", "Brute force attack"],
        "nonFunctionalRequirements": "Response < 500ms, 99.9% uptime"
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Lịch sử phân tích
```http
GET /api/analyze-spec/history?limit=10&offset=0
```

#### 3. Chi tiết một phân tích
```http
GET /api/analyze-spec/:id
```

### Phase 2: AI Code Review Assistant

```http
# Step 1: Upload codebase
POST /api/code-review/upload-context
Body: codebase (ZIP, max 50MB)

# Step 2: Review changes  
POST /api/code-review/review-changes
Body: contextId, changeDescription, changes (ZIP/PATCH)

# One-step review
POST /api/code-review/quick-review
Body: codebase (ZIP), changes (ZIP/PATCH), changeDescription

# Get context info
GET /api/code-review/context/:contextId
```

**Response Structure:**
```json
{
  "review": {
    "overallQuality": "string",
    "summary": { "totalIssues": 5, "criticalIssues": 1 },
    "potentialBugs": [{"file", "line", "severity", "issue", "suggestion"}],
    "performanceIssues": [...],
    "securityVulnerabilities": [...],
    "conventionViolations": [...],
    "improvements": [...],
    "positivePoints": ["..."]
  }
}
```

**See [Phase 2 API Documentation](./07-phase2-api.md) for details.**

## ✨ Key Features

- **AI Model:** Gemini 2.5 Pro (configurable)
- **Framework:** Firebase Genkit 1.21.0
- **Structured Output:** Zod schema validation
- **Caching:** Redis (TTL: 1h for reviews, 24h for context)
- **File Support:** PDF (10MB), ZIP (50MB), PATCH/DIFF
- **Dev Tools:** Genkit Dev UI at http://localhost:4000

## ⚡ Performance

| Operation | Time |
|-----------|------|
| PDF Parsing | < 2s |
| AI Analysis | 5-15s |
| Cache Hit | < 100ms |
| Total (cached) | < 200ms |
| Total (new) | 7-20s |

## 🔒 Security

- **File Validation:** Type, size, MIME checking
- **Size Limits:** PDF 10MB, ZIP 50MB
- **Input Sanitization:** All inputs validated
- **Env Protection:** API keys in .env only

## 🎓 Tài liệu liên quan

- [Tech Stack](./02-tech-stack.md) - Chi tiết công nghệ sử dụng
- [Getting Started](./03-getting-started.md) - Hướng dẫn setup
- [Phase 1 Guide](./04-phase1-guide.md) - Giải thích code chi tiết
- [Genkit Guide](./05-genkit-guide.md) - Hướng dẫn Genkit
- [Phase 2 Guide](./06-phase2-guide.md) - AI Code Review Assistant
- [Phase 2 API](./07-phase2-api.md) - API Documentation
- [Phase 2 Testing](./08-phase2-testing.md) - Testing Guide
