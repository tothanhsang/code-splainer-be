# 🎯 START HERE - Documentation Guide

## 📚 Cấu trúc Documentation

Tài liệu được tổ chức theo thứ tự đọc từ cơ bản đến nâng cao:

```
docs/
├── 00-START-HERE.md           ⭐ Bạn đang ở đây
├── README.md                   📖 Index và reading paths
├── 01-overview.md              🏗️ Tổng quan dự án, architecture
├── 02-tech-stack.md            🛠️ Tech stack và lý do chọn
├── 03-getting-started.md       🚀 Hướng dẫn setup từ đầu
├── 04-phase1-guide.md          📘 Phase 1: AI Spec Analyzer
├── 05-genkit-guide.md          🔥 Firebase Genkit guide
├── 06-phase2-guide.md          🔍 Phase 2: Code Review Assistant
├── 07-phase2-api.md            📚 Phase 2 API Documentation
└── 08-phase2-testing.md        🧪 Phase 2 Testing Guide
```

---

## 🎯 Bắt đầu từ đâu?

### 👶 Người mới hoàn toàn

**Bạn chưa biết gì về project?**

```
1. 📖 README.md (5 phút)
   ↓
2. 🏗️ 01-overview.md (15 phút)
   ↓
3. 🚀 03-getting-started.md (30 phút)
   ↓
4. 📘 04-phase1-guide.md (45 phút)
```

### 💻 Developer muốn code

**Bạn muốn implement hoặc hiểu code?**

```
1. 🚀 03-getting-started.md
   ↓
2. 🛠️ 02-tech-stack.md
   ↓
3. 📘 04-phase1-guide.md
   ↓
4. 🔥 05-genkit-guide.md
   ↓
5. 🔍 06-phase2-guide.md
```

### 🏢 Tech Lead / Architect

**Bạn muốn hiểu architecture và design decisions?**

```
1. 🏗️ 01-overview.md
   ↓
2. 🛠️ 02-tech-stack.md
   ↓
3. 🔍 06-phase2-guide.md
   ↓
4. 📚 07-phase2-api.md
```

### 🧪 QA / Tester

**Bạn muốn test hệ thống?**

```
1. 🏗️ 01-overview.md (hiểu tổng quan)
   ↓
2. 🚀 03-getting-started.md (setup)
   ↓
3. 🧪 08-phase2-testing.md (test guide)
   ↓
4. 📚 07-phase2-api.md (API details)
```

---

## 📊 Tổng quan 2 Phases

### ✅ Phase 1: AI Spec Analyzer

**Mục đích:** Phân tích file FSD (PDF) và tạo analysis cho Developers & Testers

**Tài liệu:**
- [04-phase1-guide.md](./04-phase1-guide.md) - Code walkthrough
- [01-overview.md](./01-overview.md#phase-1-ai-spec-analyzer---flow-diagram) - Flow diagram

**API:**
```http
POST /api/analyze-spec              # Upload & analyze PDF
GET  /api/analyze-spec/history      # Get history
GET  /api/analyze-spec/:id          # Get by ID
```

### ✅ Phase 2: AI Code Review Assistant

**Mục đích:** Review code changes với AI trong context của toàn bộ codebase

**Tài liệu:**
- [06-phase2-guide.md](./06-phase2-guide.md) - Overview & architecture
- [07-phase2-api.md](./07-phase2-api.md) - API documentation
- [08-phase2-testing.md](./08-phase2-testing.md) - Testing guide

**API:**
```http
POST /api/code-review/upload-context    # Upload codebase
POST /api/code-review/review-changes    # Review changes
POST /api/code-review/quick-review      # One-step review
GET  /api/code-review/context/:id       # Get context info
```

---

## 🔑 Key Concepts

### Firebase Genkit

Modern AI framework được sử dụng trong cả 2 phases:
- **Structured Output** với Zod validation
- **Observability** built-in
- **Type Safety** với TypeScript

👉 Đọc: [05-genkit-guide.md](./05-genkit-guide.md)

### Two-Step Workflow (Phase 2)

Phase 2 sử dụng workflow 2 bước:
1. **Upload Context** - Upload toàn bộ codebase
2. **Review Changes** - Upload code changes để review

👉 Đọc: [06-phase2-guide.md](./06-phase2-guide.md#-architecture)

### Caching Strategy

Cả 2 phases đều sử dụng Redis cache:
- **Phase 1:** Cache analysis results (1 hour)
- **Phase 2:** Cache review results (1 hour) + Context storage (24 hours)

👉 Đọc: [01-overview.md](./01-overview.md#4-caching-strategy)

---

## 🛠️ Quick Setup

```bash
# 1. Clone & install
git clone <repo>
cd code-splainer-be
pnpm install

# 2. Setup environment
cp .env.example .env
# Edit .env: Add GOOGLE_API_KEY

# 3. Setup database
createdb devinsight_ai
pnpm prisma:generate
pnpm prisma:migrate

# 4. Start server
pnpm dev

# 5. (Optional) Start Genkit Dev UI
npx genkit start
```

👉 Chi tiết: [03-getting-started.md](./03-getting-started.md)

---

## 📡 API Quick Reference

### Phase 1: Spec Analyzer

```bash
# Analyze FSD
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@spec.pdf" \
  -F "analysisFocus=Authentication"
```

### Phase 2: Code Review

```bash
# Step 1: Upload context
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@project.zip"

# Step 2: Review changes
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_CONTEXT_ID" \
  -F "changeDescription=Fixed auth bug" \
  -F "changes=@changes.patch"
```

👉 Chi tiết: [07-phase2-api.md](./07-phase2-api.md)

---

## 🧪 Testing Quick Start

### Phase 1 Test

```bash
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@test-spec.pdf"
```

### Phase 2 Test

```bash
# Create test project
mkdir test-project && cd test-project
echo "function hello() {}" > index.js
zip -r ../test.zip .

# Upload & review
curl -X POST http://localhost:3001/api/code-review/quick-review \
  -F "codebase=@test.zip" \
  -F "changes=@test.zip" \
  -F "changeDescription=Initial commit"
```

👉 Chi tiết: [08-phase2-testing.md](./08-phase2-testing.md)

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Đọc 01-overview.md
- [ ] Setup theo 03-getting-started.md
- [ ] Chạy thử Phase 1
- [ ] Hiểu Genkit basics (05-genkit-guide.md)

### Week 2: Deep Dive
- [ ] Đọc code Phase 1 (04-phase1-guide.md)
- [ ] Hiểu Genkit advanced (05-genkit-guide.md)
- [ ] Test Phase 1 với real PDFs

### Week 3: Phase 2
- [ ] Đọc Phase 2 guide (06-phase2-guide.md)
- [ ] Hiểu API (07-phase2-api.md)
- [ ] Test Phase 2 (08-phase2-testing.md)
- [ ] Integrate với frontend

---

## 💡 Tips

### Đọc Documentation
- ✅ Có code examples thực tế
- ✅ Có Mermaid diagrams
- ✅ Có troubleshooting sections
- ✅ Có testing guides

### Stuck?
1. Check [03-getting-started.md](./03-getting-started.md#-troubleshooting)
2. Check [08-phase2-testing.md](./08-phase2-testing.md#-common-issues--solutions)
3. Review [05-genkit-guide.md](./05-genkit-guide.md)

### Best Practices
- Luôn đọc overview trước khi dive vào code
- Test từng phase riêng biệt
- Sử dụng Genkit Dev UI để debug
- Check logs khi có lỗi

---

## 📞 Next Steps

**Sau khi đọc file này:**

1. **Người mới:** → [README.md](./README.md) → [01-overview.md](./01-overview.md)
2. **Developer:** → [03-getting-started.md](./03-getting-started.md)
3. **Tech Lead:** → [01-overview.md](./01-overview.md) → [02-tech-stack.md](./02-tech-stack.md)
4. **Tester:** → [08-phase2-testing.md](./08-phase2-testing.md)

---

**Happy Learning! 🎉**

Nếu bạn có câu hỏi, check [README.md](./README.md) để tìm tài liệu phù hợp.
