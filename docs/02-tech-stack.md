# 🛠️ Tech Stack - DevInsight AI Backend

## 📦 Core Technologies

### 1. Runtime & Language

#### Node.js v18+
- **Lý do chọn**: Platform ổn định, ecosystem rộng lớn
- **Tính năng sử dụng**: Async/await, ES modules, Buffer handling
- **Performance**: Non-blocking I/O cho file processing

#### TypeScript 5.9+
- **Type safety**: Catch errors tại compile time
- **Developer experience**: Auto-completion, refactoring
- **Code quality**: Interfaces, types, generics
- **Build**: Compile sang JavaScript

```typescript
// Type safety example - Advanced schema
interface SpecAnalysis {
  sourceDocuments: string[];
  analysisFocus: string;
  featureOverview: {
    name: string;
    goal: string;
    summary: string;
  };
  forDevelopers: {
    userStories: string[];
    coreFunctions: string[];
    dataRequirements: string;
    technicalNotes: string[];
  };
  forTesters: {
    acceptanceCriteria: string[];
    happyPath: string;
    edgeCasesAndRisks: string[];
    nonFunctionalRequirements: string;
  };
}

async function analyzeSpec(
  origin: { fileName: string; content: string },
  children?: Array<{ fileName: string; content: string }>,
  focus?: string
): Promise<SpecAnalysis> {
  // TypeScript ensures return type matches
}
```

### 2. Web Framework

#### Express.js 5.1.0
- **Routing**: RESTful API endpoints
- **Middleware**: CORS, body parsing, file uploads
- **Error handling**: Centralized error middleware
- **Performance**: Lightweight và nhanh

**New in Express 5**:
- ✅ Better async/await support
- ✅ Auto-catch promise rejections
- ✅ Improved error handling

```typescript
import express from 'express';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.post('/api/analyze-spec', controller.analyzeSpec);

// Error handling
app.use((err, req, res, next) => {
  // Express 5 auto-catches async errors
});
```

### 3. AI Framework

#### Firebase Genkit 1.21.0 🔥
**Tại sao chọn Genkit thay vì direct SDK?**

| Feature | Direct SDK | Genkit |
|---------|-----------|--------|
| JSON Parsing | Manual | Automatic |
| Validation | Manual | Auto with Zod |
| Type Safety | None | 100% |
| Tracing | None | Built-in |
| Testing | Hard | Easy |
| Dev Tools | None | Dev UI |

**Genkit Components:**

```typescript
// 1. Genkit Core - Main instance
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [googleAI()],
});

// 2. Flows - Reusable AI workflows
const flow = ai.defineFlow({
  name: 'analyze',
  inputSchema: z.string(),
  outputSchema: AnalysisSchema,
}, async (input) => {
  // Flow logic with auto-tracing
});

// 3. Generate - AI content generation
const result = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: 'Analyze this...',
  output: { schema: OutputSchema },
});
```

**Key Features:**
- ✅ **Structured Output**: Auto-validate với Zod
- ✅ **Observability**: Built-in tracing và metrics
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Dev UI**: Test flows tại http://localhost:4000
- ✅ **Multi-Model**: Dễ dàng switch giữa models

#### Google Gemini AI
- **Model sử dụng**: Gemini 1.5 Flash
- **Lý do chọn**: 
  - Nhanh (low latency)
  - Rẻ (cost-effective)
  - Context window lớn (1M tokens)
  - Structured output support
- **API**: Via Firebase Genkit plugin

```typescript
import { googleAI } from '@genkit-ai/googleai';

// Model configuration
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: prompt,
  config: {
    temperature: 0.3,      // Consistent output
    maxOutputTokens: 2048, // Limit response size
  },
});
```

### 4. Database

#### PostgreSQL 15+
**Lý do chọn PostgreSQL:**
- ✅ ACID compliance
- ✅ JSONB support (flexible data)
- ✅ Full-text search
- ✅ Robust và proven
- ✅ Excellent TypeScript integration

**Features sử dụng:**
```sql
-- JSONB for flexible data structures
CREATE TABLE spec_analyses (
    analysis_focus   TEXT,                   -- User-defined focus
    analysis_result  JSONB,                  -- Full advanced analysis
    -- Legacy fields (backward compatibility)
    user_stories     JSONB,
    features         JSONB,
    notes            JSONB
);

-- UUID primary keys
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()

-- Timestamps
created_at TIMESTAMP DEFAULT NOW()
```

#### Prisma 6.17.1 (ORM)
**Lý do chọn Prisma:**
- ✅ Type-safe database client
- ✅ Auto-generated TypeScript types
- ✅ Migration system
- ✅ Prisma Studio (DB GUI)
- ✅ Excellent DX

```prisma
// schema.prisma
model SpecAnalysis {
  id          String   @id @default(uuid())
  fileName    String
  overview    String   @db.Text
  userStories Json     // TypeScript: string[]
  features    Json
  notes       Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("spec_analyses")
}
```

**Prisma Features:**
```typescript
// Type-safe queries
const analysis = await prisma.specAnalysis.create({
  data: {
    fileName: 'spec.pdf',
    overview: 'Overview text',
    userStories: ['story1', 'story2'], // Auto-serialized
  },
});

// Type-safe results
const analyses = await prisma.specAnalysis.findMany({
  take: 10,
  orderBy: { createdAt: 'desc' },
});
// analyses has full TypeScript types
```

### 5. Caching

#### Redis (IORedis 5.8.1)
**Lý do sử dụng Redis:**
- ✅ In-memory speed (microseconds)
- ✅ TTL support
- ✅ High availability
- ✅ Optional (graceful degradation)

**Use cases:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

// Cache AI results
const cacheKey = `analysis:${md5Hash}`;

// Check cache
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Set cache with TTL
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

**Performance Impact:**
- Cache hit: < 100ms (vs 7-20s without cache)
- Cache miss: Normal AI processing time

## 📚 Supporting Libraries

### File Processing

#### pdf-parse 2.3.0
```typescript
import pdf from 'pdf-parse';

async extractText(file: Buffer): Promise<string> {
  const data = await pdf(file);
  return data.text;
}
```

#### express-fileupload 1.5.2
```typescript
import fileUpload from 'express-fileupload';

app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));
```

### Validation

#### Zod 3.23.8
**Schema-first validation:**
```typescript
import { z } from 'zod';

const SpecAnalysisSchema = z.object({
  overview: z.string().min(10),
  userStories: z.array(z.string()).min(1),
  features: z.array(z.string()),
  notes: z.array(z.string()),
});

type SpecAnalysis = z.infer<typeof SpecAnalysisSchema>;
```

**Integration với Genkit:**
- Genkit sử dụng Zod cho input/output validation
- Auto-validate AI responses
- Type-safe output

### Utilities

#### cors 2.8.5
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
```

#### dotenv 17.2.3
```typescript
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
```

## 🔧 Development Tools

### Package Manager: pnpm
**Lý do chọn pnpm:**
- ✅ Faster than npm/yarn
- ✅ Disk space efficient
- ✅ Strict dependency resolution
- ✅ Monorepo support

### TypeScript Execution: tsx 4.20.6
```bash
# Development với hot reload
tsx watch src/server.ts

# Production build
tsc && node dist/server.js
```

### Database Tools: Prisma CLI
```bash
# Generate client
prisma generate

# Run migrations
prisma migrate dev

# Open GUI
prisma studio
```

## 🏗️ Architecture Patterns

### 1. Layered Architecture
```
src/
├── controllers/     # Request handling
├── services/        # Business logic
├── prompts/         # Centralized prompt management (NEW)
├── config/          # Configuration
└── routes/          # API routing
```

**NEW: Centralized Prompt Management**
- ✅ Prompts separated from service logic
- ✅ Version control for prompts
- ✅ Type-safe prompt parameters
- ✅ Easy to update and test
- ✅ Reusable across services

### 2. Dependency Injection
```typescript
// config/database.ts
export const prisma = new PrismaClient();

// services/aiAnalysis.service.ts
import { prisma } from '../config/database';

class AIAnalysisService {
  async saveAnalysis(data) {
    return prisma.specAnalysis.create({ data });
  }
}
```

### 3. Service Pattern
```typescript
class PDFParserService {
  async extractText(file: Buffer): Promise<string> { }
  validatePDF(file: UploadedFile): void { }
}

class AIAnalysisService {
  async analyzeSpec(text: string): Promise<Analysis> { }
}
```

## 📊 Technology Comparison

### Why Not These Alternatives?

| Instead of | Why chosen | Reason |
|------------|-----------|--------|
| NestJS | Express | Simpler, lighter |
| MongoDB | PostgreSQL | ACID, relations |
| LangChain | Genkit | Better DX, type-safe |
| Direct AI SDK | Genkit | Structured output, observability |
| MySQL | PostgreSQL | JSONB, better features |

## 🎯 Tech Stack Benefits

### Developer Experience
- ✅ Full TypeScript type safety
- ✅ Hot reload trong development
- ✅ Prisma Studio cho DB GUI
- ✅ Genkit Dev UI cho AI testing
- ✅ Excellent tooling

### Production Ready
- ✅ Error handling comprehensive
- ✅ Logging và tracing
- ✅ Environment configuration
- ✅ Database migrations
- ✅ Caching strategy

### Performance
- ✅ Non-blocking I/O
- ✅ Redis caching
- ✅ Efficient AI calls
- ✅ Connection pooling

### Scalability
- ✅ Stateless design
- ✅ Horizontal scaling ready
- ✅ Queue system compatible
- ✅ Cloud deployment ready

## 🔄 Version Compatibility

```json
{
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## 🎓 Learning Resources

- **Genkit**: https://firebase.google.com/docs/genkit
- **Prisma**: https://www.prisma.io/docs
- **Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Zod**: https://zod.dev/

## 📝 Summary

Tech stack được chọn để optimize:
1. **Developer Experience** - TypeScript, Prisma, Genkit Dev UI
2. **Type Safety** - Full type coverage từ DB đến AI
3. **Performance** - Redis caching, efficient AI calls
4. **Reliability** - PostgreSQL ACID, error handling
5. **Maintainability** - Clean architecture, documented code
