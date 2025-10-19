# 🔥 Firebase Genkit - Complete Guide

## 📋 Giới thiệu Genkit

**Firebase Genkit** là AI framework mới từ Google, được thiết kế để build production-ready AI applications với TypeScript.

### Tại sao chọn Genkit?

| Feature | Direct AI SDK | Genkit |
|---------|--------------|--------|
| JSON Parsing | Manual (`JSON.parse`) | Automatic |
| Output Validation | Manual checks | Auto with Zod |
| Type Safety | None (`any` types) | 100% TypeScript |
| Observability | None | Built-in tracing |
| Testing | Hard to mock | Easy with flows |
| Dev Tools | None | Genkit Dev UI |
| Error Handling | Manual | Built-in retry logic |

## 🏗️ Core Concepts

### 1. Genkit Instance

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Khởi tạo Genkit với plugins
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});
```

**Giải thích:**
- `genkit()` - Factory function tạo AI instance
- `plugins` - Array of AI providers (Google AI, OpenAI, Anthropic...)
- Plugin configuration - API keys và settings

### 2. Flows - Reusable AI Workflows

```typescript
import { z } from 'zod';

const myFlow = ai.defineFlow(
  {
    name: 'myFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      result: z.string(),
    }),
  },
  async ({ text }) => {
    // Flow logic here
    const response = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: `Process: ${text}`,
    });
    
    return { result: response.text };
  }
);

// Sử dụng flow
const result = await myFlow({ text: 'Hello' });
```

**Lợi ích của Flows:**
- ✅ Reusable - Gọi lại nhiều lần
- ✅ Traceable - Auto-logging mọi execution
- ✅ Testable - Easy to mock và test
- ✅ Type-safe - Input/output đều có types

### 3. Generate - AI Content Generation

```typescript
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: 'Your prompt here',
  output: {
    schema: YourZodSchema, // Optional: structured output
  },
  config: {
    temperature: 0.7,
    maxOutputTokens: 1024,
    topK: 40,
    topP: 0.95,
  },
});

// Access output
const text = response.text;        // Plain text
const output = response.output;    // Structured (if schema provided)
```

### 4. Structured Output với Zod

**Định nghĩa schema:**

```typescript
import { z } from 'zod';

const AnalysisSchema = z.object({
  summary: z.string().describe('Brief summary'),
  keyPoints: z.array(z.string()).describe('Key points'),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
});

type Analysis = z.infer<typeof AnalysisSchema>;
```

**Sử dụng với Genkit:**

```typescript
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: 'Analyze this text...',
  output: {
    schema: AnalysisSchema, // Genkit tự động validate
  },
});

// response.output có type Analysis
// Nếu AI response không match schema, Genkit sẽ retry
```

**Lợi ích:**
- ✅ No manual JSON parsing
- ✅ Auto-validation
- ✅ Type-safe results
- ✅ Better AI prompt compliance

## 📊 DevInsight AI - Genkit Implementation

### Config Setup

```typescript
// src/config/gemini.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is required');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});

export default ai;
```

### Analysis Flow Definition

```typescript
// src/services/aiAnalysis.service.ts
import { ai } from '../config/gemini';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// 1. Define Advanced Output Schema
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

// 2. Define Multi-Document Input Schema
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

// 3. Define Flow
export const analyzeSpecFlow = ai.defineFlow(
  {
    name: 'analyzeSpec',
    inputSchema: MultiDocumentInput,
    outputSchema: SpecAnalysisSchema,
  },
  async ({ originDocument, childDocuments = [], analysisFocus = 'Toàn bộ tính năng' }) => {
    // 4. Import centralized prompt
    const { SPEC_ANALYSIS_PROMPT, buildDocumentSections } = 
      await import('../prompts/specAnalysis.prompt');
    
    // 5. Build document sections
    const allDocumentNames = [
      originDocument.fileName,
      ...childDocuments.map(doc => doc.fileName),
    ];
    const documentSections = buildDocumentSections(originDocument, childDocuments);
    
    // 6. Create Prompt using centralized template
    const prompt = SPEC_ANALYSIS_PROMPT({
      allDocumentNames,
      analysisFocus,
      documentSections,
    });

    // 4. Generate with AI
    const response = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: prompt,
      output: {
        schema: SpecAnalysisSchema, // Auto-validate
      },
      config: {
        temperature: 0.3,      // Consistent output
        maxOutputTokens: 2048,
      },
    });

    // 5. Validate and Return
    if (!response.output) {
      throw new Error('AI response does not match schema');
    }

    return response.output; // Type-safe SpecAnalysisResult
  }
);

// 7. Use in Service with Multi-Document Support
export class AIAnalysisService {
  async analyzeSpec(
    originDocument: { fileName: string; content: string },
    childDocuments?: Array<{ fileName: string; content: string }>,
    analysisFocus?: string
  ) {
    const result = await analyzeSpecFlow({
      originDocument,
      childDocuments: childDocuments || [],
      analysisFocus: analysisFocus || 'Toàn bộ tính năng',
    });
    return result; // Fully typed SpecAnalysisResult
  }
}
```

**Key Updates:**
- ✅ Advanced schema structure (featureOverview, forDevelopers, forTesters)
- ✅ Multi-document input support
- ✅ Centralized prompt management
- ✅ Type-safe throughout
- ✅ Analysis focus parameter
```

### Flow Tracing

Genkit tự động trace mọi flow execution:

```typescript
// Automatically logged:
// - Flow name
// - Input data
// - Execution time
// - Model calls
// - Output data
// - Errors (if any)
```

Xem traces trong Genkit Dev UI:
```bash
npx genkit start
# Open http://localhost:4000
```

## 🎮 Genkit Dev UI

### Khởi động Dev UI

```bash
# Terminal 1: Run server
pnpm dev

# Terminal 2: Run Genkit Dev UI
npx genkit start
```

Truy cập: **http://localhost:4000**

### Features trong Dev UI

#### 1. Flow Inspector
- Xem tất cả flows trong app
- View flow definition và schema
- Run flows interactively

#### 2. Run Flow
```
1. Select flow (e.g., analyzeSpec)
2. Input data (JSON format)
3. Click "Run"
4. View output và traces
```

#### 3. Trace Viewer
- Execution timeline
- Model calls và latency
- Input/output data
- Error details (if any)

#### 4. Model Playground
- Test prompts directly
- Try different models
- Adjust parameters (temperature, tokens)
- Compare outputs

### Example: Testing analyzeSpec Flow

**Input (Multi-Document):**
```json
{
  "originDocument": {
    "fileName": "main-spec.pdf",
    "content": "Feature: User Authentication System\n\nOverview: Users need secure login...\n\nRequirements:\n- Email/password authentication\n- JWT tokens\n- Role-based access control"
  },
  "childDocuments": [
    {
      "fileName": "security-spec.pdf",
      "content": "Security Requirements:\n- Password hashing with bcrypt\n- Token expiration: 24h\n- Rate limiting: 5 attempts per 5 minutes"
    }
  ],
  "analysisFocus": "Authentication and security features"
}
```

**View Results:**
- Advanced structured output (featureOverview, forDevelopers, forTesters)
- Execution time
- Tokens used
- Model parameters
- Multi-document analysis traces

## 🔄 Model Switching

### Supported Models

```typescript
import { googleAI } from '@genkit-ai/googleai';

// Available Google AI models
googleAI.model('gemini-1.5-flash')      // Fast, cheap
googleAI.model('gemini-1.5-pro')        // Better quality
googleAI.model('gemini-1.5-pro-vision') // Vision support
```

### Dễ dàng đổi model

```typescript
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-pro'), // Đổi model
  prompt: prompt,
});
```

### Multi-Provider Support

```typescript
import { googleAI } from '@genkit-ai/googleai';
import { openAI, gpt4 } from '@genkit-ai/openai';
import { anthropic, claude3 } from '@genkit-ai/anthropic';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
    openAI({ apiKey: process.env.OPENAI_API_KEY }),
    anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  ],
});

// Sử dụng model từ provider khác
const response = await ai.generate({
  model: gpt4,        // OpenAI
  // or
  model: claude3,     // Anthropic
  prompt: '...',
});
```

## 🧪 Testing với Genkit

### Unit Test Flow

```typescript
import { analyzeSpecFlow } from './aiAnalysis.service';

describe('analyzeSpecFlow', () => {
  it('should analyze FSD correctly', async () => {
    const input = {
      fsdText: 'Sample FSD content...',
    };

    const result = await analyzeSpecFlow(input);

    // Type-safe assertions
    expect(result).toHaveProperty('overview');
    expect(result.userStories).toBeInstanceOf(Array);
    expect(result.features.length).toBeGreaterThan(0);
  });
});
```

### Mock Flow

```typescript
// Mock flow for testing
jest.mock('./aiAnalysis.service', () => ({
  analyzeSpecFlow: jest.fn(async () => ({
    overview: 'Mocked overview',
    userStories: ['Story 1'],
    features: ['Feature 1'],
    notes: ['Note 1'],
  })),
}));
```

## ⚡ Advanced Features

### 1. Streaming Responses

```typescript
const stream = await ai.generateStream({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: 'Write a long document...',
});

for await (const chunk of stream) {
  console.log(chunk.text);
  // Stream to client via WebSocket
}
```

### 2. System Instructions

```typescript
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  system: 'You are a professional technical writer.',
  prompt: 'Document this code...',
});
```

### 3. Multi-turn Conversations

```typescript
const conversation = ai.chat({
  model: googleAI.model('gemini-1.5-flash'),
});

await conversation.send('Hello');
const response1 = await conversation.send('What is Genkit?');
const response2 = await conversation.send('How does it help?');
```

### 4. Tool Calling (Function Calling)

```typescript
const searchTool = ai.defineTool({
  name: 'search',
  description: 'Search for information',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    results: z.array(z.string()),
  }),
}, async ({ query }) => {
  // Implement search logic
  return { results: ['result1', 'result2'] };
});

const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: 'Search for TypeScript best practices',
  tools: [searchTool],
});
```

## 📈 Performance Optimization

### 1. Caching

```typescript
import redis from '../config/redis';
import crypto from 'crypto';

async function analyzeWithCache(text: string) {
  // Create cache key
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const cacheKey = `analysis:${hash}`;

  // Check cache
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  // Run flow
  const result = await analyzeSpecFlow({ fsdText: text });

  // Save to cache
  if (redis) {
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
  }

  return result;
}
```

### 2. Timeout Configuration

```typescript
const response = await ai.generate({
  model: googleAI.model('gemini-1.5-flash'),
  prompt: prompt,
  config: {
    timeout: 30000, // 30 seconds
  },
});
```

### 3. Batch Processing

```typescript
async function batchAnalyze(texts: string[]) {
  const results = await Promise.all(
    texts.map(text => analyzeSpecFlow({ fsdText: text }))
  );
  return results;
}
```

## 🔐 Security Best Practices

### 1. API Key Protection

```typescript
// ✅ Good - From environment
apiKey: process.env.GOOGLE_API_KEY

// ❌ Bad - Hardcoded
apiKey: 'AIzaSy...'
```

### 2. Input Validation

```typescript
const SafeInputSchema = z.object({
  fsdText: z.string()
    .max(100000)              // Limit size
    .regex(/^[\w\s.,!?-]+$/), // Sanitize
});
```

### 3. Output Sanitization

```typescript
const response = await ai.generate({ ... });

// Sanitize before storing
const sanitized = {
  overview: sanitize(response.output.overview),
  userStories: response.output.userStories.map(sanitize),
};
```

## 🚀 Production Deployment

### Environment Variables

```env
# Production
GOOGLE_API_KEY=your_production_key
NODE_ENV=production
GENKIT_ENV=production
```

### Error Handling

```typescript
try {
  const result = await analyzeSpecFlow({ fsdText });
  return result;
} catch (error) {
  // Log error
  console.error('Flow error:', error);
  
  // Retry logic (optional)
  if (retryCount < MAX_RETRIES) {
    return retry(analyzeSpecFlow, { fsdText });
  }
  
  throw new Error('Analysis failed after retries');
}
```

### Monitoring

```typescript
// Genkit automatically exports metrics
// Integrate with:
// - Google Cloud Trace
// - OpenTelemetry
// - Custom monitoring service
```

## 📚 Genkit API Reference

### Core Methods

```typescript
// Define Flow
ai.defineFlow(config, handler)

// Generate Content
ai.generate(options)

// Stream Content
ai.generateStream(options)

// Chat
ai.chat(config)

// Define Tool
ai.defineTool(config, handler)

// Define Prompt
ai.definePrompt(config)
```

### Configuration Options

```typescript
// Model Config
{
  temperature: 0.0-2.0,        // Randomness (0 = deterministic)
  maxOutputTokens: number,     // Max response length
  topK: number,                // Top-K sampling
  topP: number,                // Top-P sampling
  timeout: number,             // Milliseconds
}
```

## 🎯 Common Patterns

### Pattern 1: Analysis Flow

```typescript
const analyzeFlow = ai.defineFlow({
  name: 'analyze',
  inputSchema: z.string(),
  outputSchema: AnalysisSchema,
}, async (input) => {
  const response = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    prompt: `Analyze: ${input}`,
    output: { schema: AnalysisSchema },
  });
  return response.output;
});
```

### Pattern 2: Transformation Flow

```typescript
const transformFlow = ai.defineFlow({
  name: 'transform',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
}, async (input) => {
  // Multi-step transformation
  const step1 = await ai.generate({ ... });
  const step2 = await ai.generate({ ... });
  return { ...step1, ...step2 };
});
```

### Pattern 3: Validation Flow

```typescript
const validateFlow = ai.defineFlow({
  name: 'validate',
  inputSchema: DataSchema,
  outputSchema: ValidationResultSchema,
}, async (data) => {
  const response = await ai.generate({
    prompt: `Validate this data: ${JSON.stringify(data)}`,
    output: { schema: ValidationResultSchema },
  });
  return response.output;
});
```

## 🎓 Learning Resources

- **Official Docs**: https://firebase.google.com/docs/genkit
- **GitHub**: https://github.com/firebase/genkit
- **Examples**: https://github.com/firebase/genkit/tree/main/js/samples
- **Discord**: https://discord.gg/genkit

## ✅ Genkit Checklist

- [ ] Hiểu Genkit instance và plugins
- [ ] Biết cách define flows
- [ ] Sử dụng structured output với Zod
- [ ] Test flows trong Dev UI
- [ ] Implement caching strategy
- [ ] Handle errors properly
- [ ] Deploy to production

## 🎉 Summary

**Genkit giúp:**
- ✅ Code sạch hơn và maintainable
- ✅ Type safety 100%
- ✅ Built-in observability
- ✅ Easy testing
- ✅ Production-ready

**DevInsight AI với Genkit:**
- Professional AI framework
- Type-safe workflows
- Better developer experience
- Ready to scale
