# 🚀 DevInsight AI - Backend

Backend API cho **DevInsight AI** - Trợ lý AI toàn diện giúp developers phân tích tài liệu FSD và review code tự động.

## ⚡ Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env và thêm GOOGLE_API_KEY

# Setup database
createdb devinsight_ai
pnpm prisma:generate
pnpm prisma:migrate

# Run server
pnpm dev
```

Server sẽ chạy tại: **http://localhost:3001**

## 📚 Documentation

Toàn bộ tài liệu chi tiết nằm trong folder **`docs/`**:

| File | Nội dung |
|------|----------|
| [⭐ 00-START-HERE.md](./docs/00-START-HERE.md) | **Bắt đầu từ đây** - Quick navigation guide |
| [📖 README.md](./docs/README.md) | **Documentation index** - Tổng hợp tài liệu |
| [📖 01-overview.md](./docs/01-overview.md) | **Tổng quan dự án**, kiến trúc, flow diagrams chi tiết |
| [🛠️ 02-tech-stack.md](./docs/02-tech-stack.md) | **Tech stack**, công nghệ sử dụng và lý do chọn |
| [🚀 03-getting-started.md](./docs/03-getting-started.md) | **Hướng dẫn setup** chi tiết, environment, database |
| [📘 04-phase1-guide.md](./docs/04-phase1-guide.md) | **Giải thích code Phase 1** (AI Spec Analyzer) |
| [🔥 05-genkit-guide.md](./docs/05-genkit-guide.md) | **Hướng dẫn Genkit** cụ thể, flows, Dev UI |
| [🔍 06-phase2-guide.md](./docs/06-phase2-guide.md) | **Phase 2 Guide** (AI Code Review Assistant) |
| [📚 07-phase2-api.md](./docs/07-phase2-api.md) | **Phase 2 API** Documentation |
| [🧪 08-phase2-testing.md](./docs/08-phase2-testing.md) | **Phase 2 Testing** Guide |

## 🎯 Features

### ✅ Phase 1: AI Spec Analyzer
**Input:** PDF files (origin + children), analysis focus  
**Output:** Structured analysis for Developers & Testers  
**Storage:** PostgreSQL + Redis cache (1h)

### ✅ Phase 2: AI Code Review Assistant
**Input:** Codebase (ZIP) + Changes (ZIP/PATCH)  
**Output:** Bug detection, performance issues, security vulnerabilities, convention violations  
**Storage:** Redis only (context 24h, review 1h)

## 🏗️ Tech Stack

- **TypeScript** + **Express.js** - Backend framework
- **Firebase Genkit 1.21.0** - AI framework with observability
- **Google Gemini 2.5 Pro** - AI model (configurable)
- **Prisma** + **PostgreSQL** - Database (Phase 1 only)
- **Redis** - Caching & context storage
- **Zod** - Schema validation

## 📡 API Endpoints

**Phase 1:** `/api/analyze-spec` (POST, GET)  
**Phase 2:** `/api/code-review/*` (upload-context, review-changes, quick-review, context/:id)

→ See [docs/01-overview.md](./docs/01-overview.md) for details

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/health

# Upload PDF
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "fsd=@/path/to/spec.pdf"

# Genkit Dev UI
npx genkit start  # http://localhost:4000
```

## 🔧 Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| GOOGLE_API_KEY not defined | Kiểm tra file `.env`, lấy key tại https://makersuite.google.com/app/apikey |
| Can't reach database | `pg_isready`, `createdb devinsight_ai` |
| Prisma errors | `pnpm prisma:generate && pnpm prisma:migrate` |
| Port in use | `lsof -i :3001` và kill process |

Chi tiết xem [docs/03-getting-started.md](./docs/03-getting-started.md)

## 🚀 Deployment

### Complete Step-by-Step Guide
**[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deploy to Render.com (FREE) in 10 minutes

### Pre-Deployment Check
```bash
./deploy-check.sh  # Verify everything is ready
```

### What You Need
- GitHub account
- Google AI API Key (free)
- Upstash Redis account (free)

### Platform: Render.com (Recommended)
- ✅ 750 hours/month (free)
- ✅ PostgreSQL included
- ✅ Auto-deploy from GitHub
- ✅ Total cost: $0/month

## 🎯 Roadmap

- [x] Phase 1: AI Spec Analyzer
- [x] Phase 2: AI Code Review Assistant
- [x] Deployment guides and configurations
- [ ] Frontend integration
- [ ] Real-time streaming với WebSocket
- [ ] Rate limiting & authentication
- [ ] CI/CD integration
