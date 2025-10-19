# 📘 Phase 1: AI Spec Analyzer - Code Guide

## 🎯 Tổng quan Phase 1

Phase 1 implement chức năng phân tích FSD (Functional Specification Document) tự động bằng AI.

**Input:** 
- 1 file PDF gốc (origin) - required
- Nhiều file PDF con (children) - optional
- Analysis Focus - optional

**Output:** Advanced structured analysis gồm:
- Feature Overview (name, goal, summary)
- For Developers (user stories, core functions, data requirements, technical notes)
- For Testers (acceptance criteria, happy path, edge cases, NFRs)

## 🏗️ Cấu trúc Code

```
src/
├── config/
│   ├── database.ts          # Prisma client configuration
│   ├── redis.ts             # Redis client configuration
│   └── gemini.ts            # Genkit & Gemini AI configuration
├── controllers/
│   └── specAnalyzer.controller.ts  # HTTP request handling
├── services/
│   ├── pdfParser.service.ts        # PDF text extraction
│   └── aiAnalysis.service.ts       # AI analysis logic
├── prompts/
│   ├── specAnalysis.prompt.ts      # Centralized prompt templates
│   └── codeDocumentation.prompt.ts # Phase 2 prompts (TODO)
├── routes/
│   └── api.routes.ts               # API routing
└── server.ts                       # Application entry point
```

## 📦 Chi tiết từng file

### 1. server.ts - Application Entry Point

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================
// MIDDLEWARE SETUP
// =====================================

// 1. CORS - Cho phép cross-origin requests
app.use(cors());

// 2. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. File upload
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

// =====================================
// ROUTES
// =====================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'DevInsight AI Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// =====================================
// ERROR HANDLING
// =====================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
  console.log(`\n🚀 DevInsight AI Backend`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
```

**Key Points:**
- Express setup với middleware stack
- CORS cho cross-origin requests
- File upload với size limit 10MB
- Centralized error handling
- Clean startup logging

---

### 2. config/database.ts - Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton
 * Sử dụng singleton pattern để avoid multiple instances
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

**Key Points:**
- Singleton pattern để reuse connection
- Conditional logging (verbose trong dev, errors only trong prod)
- Graceful disconnection on app shutdown
- Auto-generated types từ Prisma schema

**Usage trong services:**
```typescript
import prisma from '../config/database';

// Type-safe query
const analysis = await prisma.specAnalysis.create({
  data: { ... },
});
```

---

### 3. config/redis.ts - Redis Client

```typescript
import Redis from 'ioredis';

/**
 * Redis client for caching
 * Optional - gracefully degrades if not available
 */
let redis: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('⚠️  Redis error:', err.message);
  });
} catch (error) {
  console.warn('⚠️  Redis not available, running without cache');
}

export default redis;
```

**Key Points:**
- Optional dependency với null check
- Retry strategy cho connection failures
- Event listeners cho connection status
- Graceful degradation nếu Redis không available

**Usage với null check:**
```typescript
import redis from '../config/redis';

// Always check if redis is available
if (redis) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
}
```

---

### 4. config/gemini.ts - Genkit Configuration

```typescript
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Initialize Genkit with Google AI plugin
 * Genkit provides:
 * - Observability and tracing
 * - Prompt management
 * - Structured output with Zod
 * - Easy model switching
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: googleAI.model(process.env.GOOGLE_AI_MODEL || "gemini-2.5-pro"),
});

export default ai;
```

**Key Points:**
- **dotenv.config()** - Load environment variables first
- **Configurable model** - Default: gemini-2.5-pro (can override with GOOGLE_AI_MODEL env)
- **No validation** - Let Genkit handle API key errors gracefully
- **Single AI instance** - Exported for use in services
- **Ready for model switching** - Easy to change AI model via environment variable

---

### 5. services/pdfParser.service.ts - PDF Processing

```typescript
import { UploadedFile } from 'express-fileupload';

/**
 * Service để xử lý và trích xuất text từ file PDF
 */
export class PDFParserService {
  /**
   * Validate file PDF trước khi parse
   */
  validatePDF(file: UploadedFile): void {
    // Check file exists
    if (!file) {
      throw new Error('Không tìm thấy file');
    }

    // Check MIME type
    if (file.mimetype !== 'application/pdf') {
      throw new Error('File phải có định dạng PDF');
    }

    // Check file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxSize) {
      throw new Error(
        `File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Trích xuất text từ file PDF
   */
  async extractText(file: UploadedFile): Promise<string> {
    try {
      // Dynamic import to handle CommonJS/ESM interop
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule.default || pdfParseModule) as any;
      
      const dataBuffer = file.data;
      const pdfData = await pdfParse(dataBuffer);

      // Get text content from PDF
      const text = pdfData.text;

      // Validate extracted text
      if (!text || text.trim().length === 0) {
        throw new Error(
          'PDF file không chứa text hoặc text không thể đọc được'
        );
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi parse PDF: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi parse PDF');
    }
  }
}

export default new PDFParserService();
```

**Key Points:**
- Separation of validation and extraction logic
- Multiple validation checks (existence, type, size)
- Dynamic import để handle pdf-parse CommonJS module
- Comprehensive error handling
- Singleton export pattern

**Validation Flow:**
1. File exists?
2. MIME type = PDF?
3. Size < limit?
4. Text extracted?
5. Text not empty?

---

### 6. prompts/specAnalysis.prompt.ts - Centralized Prompt Management

**NEW:** Prompts được quản lý tập trung trong folder riêng để dễ maintain và version control.

```typescript
export interface SpecAnalysisPromptParams {
  allDocumentNames: string[];
  analysisFocus: string;
  documentSections: string;
}

/**
 * Main prompt template cho multi-document spec analysis
 */
export const SPEC_ANALYSIS_PROMPT = ({
  allDocumentNames,
  analysisFocus,
  documentSections,
}: SpecAnalysisPromptParams): string => `
Bạn là một Technical Product Manager và Senior Business Analyst...

--- TRỌNG TÂM PHÂN TÍCH ---
${analysisFocus}
--- KẾT THÚC TRỌNG TÂM PHÂN TÍCH ---

--- BẮT ĐẦU NỘI DUNG CÁC TÀI LIỆU ---
${documentSections}
--- KẾT THÚC NỘI DUNG CÁC TÀI LIỆU ---
`;

/**
 * Helper function để build document sections
 */
export const buildDocumentSections = (
  originDocument: { fileName: string; content: string },
  childDocuments: Array<{ fileName: string; content: string }> = []
): string => {
  let sections = `--- TÀI LIỆU GỐC: ${originDocument.fileName} ---\n${originDocument.content}\n--- KẾT THÚC TÀI LIỆU GỐC ---`;

  childDocuments.forEach((doc, index) => {
    sections += `\n\n--- TÀI LIỆU CON ${index + 1}: ${doc.fileName} ---\n${doc.content}\n--- KẾT THÚC TÀI LIỆU CON ${index + 1} ---`;
  });

  return sections;
};

export const PROMPT_VERSION = {
  version: "1.0.0",
  lastUpdated: "2025-01-17",
  description: "Multi-document spec analysis prompt",
  phase: "Phase 1 - Spec Analyzer",
};
```

**Benefits:**
- ✅ Centralized management
- ✅ Version control
- ✅ Type-safe parameters
- ✅ Easy to update
- ✅ Reusable across services

---

### 7. services/aiAnalysis.service.ts - AI Analysis Core

```typescript
import { ai } from '../config/gemini';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../config/database';
import redis from '../config/redis';
import {
  SPEC_ANALYSIS_PROMPT,
  buildDocumentSections,
} from '../prompts/specAnalysis.prompt';

/**
 * Advanced Zod schema cho output validation
 */
const SpecAnalysisSchema = z.object({
  sourceDocuments: z.array(z.string()),
  analysisFocus: z.string(),
  featureOverview: z.object({
    name: z.string(),
    goal: z.string(),
    summary: z.string(),
  }),
  forDevelopers: z.object({
    userStories: z.array(z.string()),
    coreFunctions: z.array(z.string()),
    dataRequirements: z.string(),
    technicalNotes: z.array(z.string()),
  }),
  forTesters: z.object({
    acceptanceCriteria: z.array(z.string()),
    happyPath: z.string(),
    edgeCasesAndRisks: z.array(z.string()),
    nonFunctionalRequirements: z.string(),
  }),
});

type SpecAnalysisResult = z.infer<typeof SpecAnalysisSchema>;

/**
 * Multi-document input schema
 */
const MultiDocumentInput = z.object({
  originDocument: z.object({
    fileName: z.string(),
    content: z.string(),
  }),
  childDocuments: z.array(z.object({
    fileName: z.string(),
    content: z.string(),
  })).optional().default([]),
  analysisFocus: z.string().optional().default('Toàn bộ tính năng'),
});

/**
 * Genkit Flow cho multi-document FSD analysis
 */
export const analyzeSpecFlow = ai.defineFlow(
  {
    name: 'analyzeSpec',
    inputSchema: MultiDocumentInput,
    outputSchema: SpecAnalysisSchema,
  },
  async ({ originDocument, childDocuments = [], analysisFocus = 'Toàn bộ tính năng' }) => {
    // Build document names list
    const allDocumentNames = [
      originDocument.fileName,
      ...childDocuments.map(doc => doc.fileName),
    ];

    // Build document sections using helper
    const documentSections = buildDocumentSections(originDocument, childDocuments);

    // Generate prompt using centralized template
    const prompt = SPEC_ANALYSIS_PROMPT({
      allDocumentNames,
      analysisFocus,
      documentSections,
    });

    console.log(`🤖 Analyzing ${allDocumentNames.length} documents...`);
    console.log(`📄 Origin: ${originDocument.fileName}`);
    if (childDocuments.length > 0) {
      console.log(`📄 Children: ${childDocuments.map(d => d.fileName).join(', ')}`);
    }
    console.log(`🎯 Focus: ${analysisFocus}`);

    // Use ai.generate() with Genkit auto-validation
    const llmResponse = await ai.generate(prompt);

    if (!llmResponse.text) {
      throw new Error('AI không trả về kết quả');
    }

    // Parse and validate JSON response
    const cleanedText = llmResponse.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsedResponse = JSON.parse(cleanedText);
    const analysis = SpecAnalysisSchema.parse(parsedResponse);

    console.log('✅ Analysis complete');
    return analysis;
  }
);

/**
 * Service class for AI Analysis
 */
export class AIAnalysisService {
  /**
   * Generate cache key từ text content
   */
  private createCacheKey(text: string): string {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `spec_analysis:${hash}`;
  }

  /**
   * Main analysis method với multi-document support và caching
   */
  async analyzeSpec(
    originDocument: { fileName: string; content: string },
    childDocuments?: Array<{ fileName: string; content: string }>,
    analysisFocus?: string
  ): Promise<SpecAnalysisResult> {
    // Create cache key from all documents
    const allContent = originDocument.content + 
      (childDocuments || []).map(d => d.content).join('');
    const cacheKey = this.createCacheKey(allContent);

    // Check cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('✅ Cache hit - returning cached result');
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('⚠️  Redis get error:', error);
      }
    }

    console.log('🤖 Running AI analysis...');

    // Run Genkit flow with multi-document parameters
    const analysis = await analyzeSpecFlow({
      originDocument,
      childDocuments: childDocuments || [],
      analysisFocus: analysisFocus || 'Toàn bộ tính năng',
    });

    // Cache result
    if (redis) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(analysis)); // 1 hour TTL
        console.log('✅ Result cached');
      } catch (error) {
        console.warn('⚠️  Redis set error:', error);
      }
    }

    return analysis;
  }

  /**
   * Get analysis history
   */
  async getHistory(limit: number = 10, offset: number = 0) {
    return prisma.specAnalysis.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get analysis by ID
   */
  async getById(id: string) {
    const analysis = await prisma.specAnalysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    return analysis;
  }
}

export default new AIAnalysisService();
```

**Key Points:**

1. **Centralized Prompts**: Import từ `prompts/specAnalysis.prompt.ts`
2. **Multi-Document Support**: Handle origin + multiple children documents
3. **Advanced Zod Schema**: Structured output với featureOverview, forDevelopers, forTesters
4. **Genkit Flow**: Reusable, traceable AI workflow
5. **Caching Strategy**: MD5 hash của ALL documents content làm cache key
6. **Type Safety**: Full TypeScript types từ Zod schema
7. **Analysis Focus**: User-defined focus areas cho targeted analysis

**Multi-Document Flow:**
1. Build document names list
2. Build document sections (origin + children)
3. Generate prompt với centralized template
4. AI analyzes ALL documents together
5. Return comprehensive analysis

---

### 8. controllers/specAnalyzer.controller.ts - HTTP Layer

**NEW:** Support multi-document upload (origin + children) và analysis focus.

```typescript
import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import pdfParserService from '../services/pdfParser.service';
import aiAnalysisService from '../services/aiAnalysis.service';

export class SpecAnalyzerController {
  /**
   * POST /api/analyze-spec
   * Upload và phân tích multiple FSD files
   */
  async analyzeSpec(req: Request, res: Response): Promise<void> {
    try {
      // =====================================
      // 1. VALIDATE REQUEST - Multi-document
      // =====================================
      
      if (!req.files || !req.files.origin) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng upload file FSD gốc (field: origin)',
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

      // Get optional analysis focus
      const analysisFocus = req.body?.analysisFocus as string | undefined;

      // =====================================
      // 2. VALIDATE ALL PDF FILES
      // =====================================
      
      pdfParserService.validatePDF(originFile);
      childFiles.forEach(file => pdfParserService.validatePDF(file));

      // =====================================
      // 3. EXTRACT TEXT FROM ALL PDFs
      // =====================================
      
      console.log(`📄 Processing origin: ${originFile.name}`);
      const originText = await pdfParserService.extractText(originFile);
      console.log(`✅ Extracted ${originText.length} characters from origin`);

      const childDocuments: Array<{ fileName: string; content: string }> = [];
      for (const childFile of childFiles) {
        console.log(`📄 Processing child: ${childFile.name}`);
        const childText = await pdfParserService.extractText(childFile);
        console.log(`✅ Extracted ${childText.length} characters from child`);
        childDocuments.push({
          fileName: childFile.name,
          content: childText,
        });
      }

      // =====================================
      // 4. ANALYZE WITH AI - Multi-document
      // =====================================
      
      console.log(`🤖 Starting AI analysis of ${1 + childFiles.length} documents...`);
      
      const analysis = await aiAnalysisService.analyzeSpec(
        {
          fileName: originFile.name,
          content: originText,
        },
        childDocuments,
        analysisFocus
      );

      console.log('✅ Analysis complete');

      // =====================================
      // 5. RETURN RESPONSE - Advanced structure
      // =====================================
      
      const allFileNames = [
        originFile.name,
        ...childDocuments.map(d => d.fileName),
      ].join(', ');

      res.json({
        success: true,
        data: {
          fileName: allFileNames,
          analysisFocus: analysisFocus || 'Toàn bộ tính năng',
          analysis: analysis, // Full advanced structure
        },
      });
    } catch (error) {
      console.error('❌ Error in analyzeSpec:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  }

  /**
   * GET /api/analyze-spec/history
   * Lấy lịch sử phân tích
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await aiAnalysisService.getHistory(limit, offset);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('❌ Error in getHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch history',
      });
    }
  }

  /**
   * GET /api/analyze-spec/:id
   * Lấy chi tiết một phân tích
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const analysis = await aiAnalysisService.getById(id);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error('❌ Error in getById:', error);
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
    }
  }
}

export default new SpecAnalyzerController();
```

**Key Points:**
- **Multi-document support**: Handle origin + children files
- **Analysis focus**: Optional user-defined focus areas
- **Array handling**: Proper handling of single vs multiple children files
- **Sequential processing**: Extract text from all files before analysis
- **Comprehensive logging**: Track each file processing step
- **Advanced response**: Return full structured analysis
- **Type-safe**: Full TypeScript types throughout

---

### 8. routes/api.routes.ts - API Routing

```typescript
import { Router } from 'express';
import specAnalyzerController from '../controllers/specAnalyzer.controller';

const router = Router();

// =====================================
// SPEC ANALYZER ROUTES
// =====================================

// POST /api/analyze-spec - Upload and analyze FSD
router.post(
  '/analyze-spec',
  specAnalyzerController.analyzeSpec.bind(specAnalyzerController)
);

// GET /api/analyze-spec/history - Get analysis history
router.get(
  '/analyze-spec/history',
  specAnalyzerController.getHistory.bind(specAnalyzerController)
);

// GET /api/analyze-spec/:id - Get analysis by ID
router.get(
  '/analyze-spec/:id',
  specAnalyzerController.getById.bind(specAnalyzerController)
);

export default router;
```

**Key Points:**
- Clean route definitions
- Method binding để preserve `this` context
- RESTful naming conventions
- Ready for additional routes

---

## 🔄 Complete Request Flow (Multi-Document)

```
1. Client Upload Multiple PDFs
   - origin: main-spec.pdf (required)
   - children: [api-spec.pdf, db-spec.pdf] (optional)
   - analysisFocus: "Authentication and security" (optional)
   ↓
2. Express Middleware
   - CORS
   - File Upload (express-fileupload)
   ↓
3. Router (/api/analyze-spec)
   ↓
4. Controller
   - Validate origin file exists
   - Collect children files (array handling)
   - Get analysis focus from body
   - Validate ALL PDFs (type, size)
   ↓
5. PDF Parser Service (Loop)
   - Extract text from origin PDF
   - Extract text from each child PDF
   - Build childDocuments array
   ↓
6. AI Analysis Service
   - Combine all content for cache key
   - Check Redis cache
   - If miss:
     * Build document sections (origin + children)
     * Generate prompt with SPEC_ANALYSIS_PROMPT
     * Run Genkit flow
     * AI analyzes ALL documents together
     * Validate with Advanced Zod schema
     * Cache result in Redis
   ↓
7. Controller
   - Combine all file names
   - Format advanced response
   ↓
8. Client receives Advanced JSON
   - sourceDocuments: ["main.pdf", "api.pdf", "db.pdf"]
   - featureOverview: { name, goal, summary }
   - forDevelopers: { userStories, coreFunctions, ... }
   - forTesters: { acceptanceCriteria, happyPath, ... }
```

## 🎯 Key Design Patterns

### 1. Singleton Pattern
```typescript
// Services exported as singletons
export default new PDFParserService();
export default new AIAnalysisService();
```

### 2. Dependency Injection
```typescript
// Services import config dependencies
import prisma from '../config/database';
import redis from '../config/redis';
```

### 3. Service Pattern
```typescript
// Business logic separated into services
class PDFParserService { }
class AIAnalysisService { }
```

### 4. Schema Validation
```typescript
// Zod schemas for type-safe validation
const SpecAnalysisSchema = z.object({ ... });
```

## 🔍 Testing Phase 1

### Basic Tests

```bash
# 1. Test health endpoint
curl http://localhost:3001/health

# 2. Test single document upload
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@main-spec.pdf"

# 3. Test multi-document upload
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@main-spec.pdf" \
  -F "children=@api-spec.pdf" \
  -F "children=@database-spec.pdf"

# 4. Test with analysis focus
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@main-spec.pdf" \
  -F "children=@detail-spec.pdf" \
  -F "analysisFocus=Authentication and security features"

# 5. Test history
curl http://localhost:3001/api/analyze-spec/history

# 6. Test get by ID
curl http://localhost:3001/api/analyze-spec/{id}
```

### Expected Response Structure

```json
{
  "success": true,
  "data": {
    "fileName": "main-spec.pdf, api-spec.pdf, database-spec.pdf",
    "analysisFocus": "Authentication and security features",
    "analysis": {
      "sourceDocuments": ["main-spec.pdf", "api-spec.pdf", "database-spec.pdf"],
      "analysisFocus": "Authentication and security features",
      "featureOverview": {
        "name": "User Authentication System",
        "goal": "Tính năng này giúp users có thể đăng nhập an toàn...",
        "summary": "Hệ thống xác thực người dùng..."
      },
      "forDevelopers": {
        "userStories": ["Là user, tôi muốn..."],
        "coreFunctions": ["Implement JWT authentication..."],
        "dataRequirements": "Input: email, password...",
        "technicalNotes": ["Use bcrypt for password hashing..."]
      },
      "forTesters": {
        "acceptanceCriteria": ["Given valid credentials, When..."],
        "happyPath": "User enters credentials → System validates...",
        "edgeCasesAndRisks": ["Invalid credentials", "Expired tokens..."],
        "nonFunctionalRequirements": "Performance: < 500ms response time..."
      }
    }
  }
}
```

## 📚 Next Steps

- [Genkit Guide](./05-genkit-guide.md) - Hiểu sâu hơn về Genkit
- [Phase 2 Solution](./06-phase2-solution.md) - Implement Module 2
