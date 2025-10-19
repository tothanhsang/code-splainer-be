# 🚀 Getting Started - DevInsight AI Backend

## 📋 Prerequisites

### Required Software

| Software | Version | Kiểm tra | Cài đặt |
|----------|---------|----------|---------|
| Node.js | v18+ | `node --version` | https://nodejs.org/ |
| pnpm | v8+ | `pnpm --version` | `npm install -g pnpm` |
| PostgreSQL | v15+ | `psql --version` | https://www.postgresql.org/ |
| Redis | Latest | `redis-cli ping` | Optional - cho caching |

### API Keys cần thiết

1. **Google AI Studio API Key** (BẮT BUỘC)
   - Truy cập: https://makersuite.google.com/app/apikey
   - Tạo project mới hoặc chọn project có sẵn
   - Click "Create API Key"
   - Copy API key (dạng: `AIzaSy...`)

## ⚡ Quick Start (5 phút)

### Bước 1: Clone & Install

```bash
# Di chuyển vào thư mục backend
cd code-splainer-be

# Cài đặt dependencies với pnpm
pnpm install
```

### Bước 2: Cấu hình Environment

```bash
# Copy file example
cp .env.example .env

# Mở file .env
nano .env
```

Cập nhật các biến sau:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Google AI API Key (BẮT BUỘC)
GOOGLE_API_KEY=your_api_key_here

# PostgreSQL Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devinsight_ai?schema=public"

# Redis (Optional - cho caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Bước 3: Setup Database

#### Cách 1: Tự động (Recommended)

```bash
# Tạo database
createdb devinsight_ai

# Chạy migrations
pnpm prisma:generate
pnpm prisma:migrate
```

#### Cách 2: Manual với psql

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE devinsight_ai;

# Tạo user (optional)
CREATE USER devinsight WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE devinsight_ai TO devinsight;

# Thoát
\q

# Chạy Prisma migrations
pnpm prisma:generate
pnpm prisma:migrate
```

### Bước 4: Chạy Server

```bash
# Development mode (with hot reload)
pnpm dev
```

**Kết quả mong đợi:**

```
🚀 DevInsight AI Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server running on: http://localhost:3001
📍 Health check: http://localhost:3001/health
📍 API endpoint: http://localhost:3001/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database connected
✅ Redis connected (optional)
```

### Bước 5: Test API

```bash
# Health check
curl http://localhost:3001/health

# Kết quả mong đợi:
# {
#   "status": "OK",
#   "message": "DevInsight AI Backend is running",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

## 🔧 Detailed Setup Guide

### 1. PostgreSQL Setup

#### macOS (Homebrew)

```bash
# Cài đặt
brew install postgresql@15

# Start service
brew services start postgresql@15

# Verify
pg_isready

# Tạo database
createdb devinsight_ai
```

#### Linux (Ubuntu/Debian)

```bash
# Cài đặt
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres

# Tạo database
createdb devinsight_ai
```

#### Windows

1. Download từ: https://www.postgresql.org/download/windows/
2. Chạy installer
3. Sử dụng pgAdmin để tạo database `devinsight_ai`

### 2. Redis Setup (Optional nhưng recommended)

#### macOS

```bash
# Cài đặt
brew install redis

# Start service
brew services start redis

# Test
redis-cli ping
# Kết quả: PONG
```

#### Linux

```bash
# Cài đặt
sudo apt install redis-server

# Start
sudo systemctl start redis
sudo systemctl enable redis

# Test
redis-cli ping
```

#### Docker (Cross-platform)

```bash
# Chạy Redis container
docker run -d --name redis -p 6379:6379 redis:latest

# Test
docker exec -it redis redis-cli ping
```

### 3. Environment Variables Chi Tiết

#### .env.example

```env
# ======================
# SERVER CONFIGURATION
# ======================
PORT=3001
NODE_ENV=development

# ======================
# GOOGLE AI
# ======================
# Lấy API key tại: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=

# ======================
# DATABASE
# ======================
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devinsight_ai?schema=public"

# Production example
# DATABASE_URL="postgresql://user:password@prod-host:5432/devinsight_ai?schema=public&sslmode=require"

# ======================
# REDIS (Optional)
# ======================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ======================
# FILE UPLOAD
# ======================
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# ======================
# CORS
# ======================
FRONTEND_URL=http://localhost:3000

# ======================
# GENKIT (Optional)
# ======================
GENKIT_ENV=development
```

### 4. Prisma Configuration

#### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SpecAnalysis {
  id          String   @id @default(uuid())
  fileName    String
  fileSize    Int
  overview    String   @db.Text
  userStories Json
  features    Json
  notes       Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("spec_analyses")
}

model CodeDocumentation {
  id          String   @id @default(uuid())
  fileName    String
  description String   @db.Text
  markdown    String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("code_documentations")
}
```

#### Prisma Commands

```bash
# Generate Prisma Client (sau khi update schema)
pnpm prisma:generate

# Create migration
pnpm prisma:migrate

# Reset database (XÓA tất cả data!)
pnpm prisma migrate reset

# Open Prisma Studio (DB GUI)
pnpm prisma:studio
```

## 🧪 Testing Setup

### 1. Test Health Endpoint

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "DevInsight AI Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test PDF Upload

Tạo file `test.sh`:

```bash
#!/bin/bash

# Upload sample PDF (single document)
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@/path/to/your/main-spec.pdf"

# Upload multiple PDFs with analysis focus
curl -X POST http://localhost:3001/api/analyze-spec \
  -F "origin=@/path/to/main-spec.pdf" \
  -F "children=@/path/to/detail-spec.pdf" \
  -F "analysisFocus=Authentication and security features"
```

```bash
chmod +x test.sh
./test.sh
```

### 3. Test với Postman

**Single Document:**
1. Tạo POST request: `http://localhost:3001/api/analyze-spec`
2. Chọn `Body` → `form-data`
3. Add key `origin` với type `File`
4. Upload file PDF
5. Click `Send`

**Multiple Documents:**
1. Tạo POST request: `http://localhost:3001/api/analyze-spec`
2. Chọn `Body` → `form-data`
3. Add key `origin` với type `File` → Upload main PDF
4. Add key `children` với type `File` → Upload detail PDF (có thể add nhiều)
5. Add key `analysisFocus` với type `Text` → Nhập "Authentication and security"
6. Click `Send`

### 4. Genkit Dev UI (Bonus)

```bash
# Terminal riêng
npx genkit start
```

- Truy cập: http://localhost:4000
- Test flows interactively
- View execution traces
- Debug prompts

## 🎯 Useful Commands

### Development

```bash
# Start dev server với hot reload
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start
```

### Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio

# Reset database
pnpm prisma migrate reset
```

### Genkit

```bash
# Start Genkit Dev UI
npx genkit start

# View at: http://localhost:4000
```

### Debugging

```bash
# Check PostgreSQL status
pg_isready

# Check PostgreSQL version
psql --version

# Connect to database
psql -U postgres -d devinsight_ai

# Check Redis
redis-cli ping

# View Redis keys
redis-cli keys "*"
```

## 🆘 Troubleshooting

### ❌ "GOOGLE_API_KEY is not defined"

**Nguyên nhân:** File `.env` thiếu hoặc API key chưa được set

**Giải pháp:**
```bash
# Kiểm tra file .env
cat .env | grep GOOGLE_API_KEY

# Nếu empty, cập nhật:
echo 'GOOGLE_API_KEY=your_key_here' >> .env

# Restart server
```

### ❌ "Can't reach database server"

**Nguyên nhân:** PostgreSQL không chạy hoặc connection string sai

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready

# Nếu không chạy, start lại
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql

# Kiểm tra connection string trong .env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### ❌ "Prisma Client not generated"

**Giải pháp:**
```bash
pnpm prisma:generate
```

### ❌ "Port 3001 already in use"

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :3001

# Kill process
kill -9 <PID>

# Hoặc đổi PORT trong .env
PORT=3002
```

### ❌ "Redis connection failed"

**Giải pháp:**
```bash
# Kiểm tra Redis đang chạy
redis-cli ping

# Nếu không chạy:
brew services start redis  # macOS
sudo systemctl start redis # Linux

# Hoặc comment Redis config trong .env (optional)
```

### ❌ "Module not found"

**Giải pháp:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules
pnpm install

# Clear pnpm cache
pnpm store prune
pnpm install
```

## 📊 Verify Installation

Checklist sau khi setup:

- [ ] `node --version` returns v18+
- [ ] `pnpm --version` returns v8+
- [ ] `psql --version` returns v15+
- [ ] Database `devinsight_ai` đã tạo
- [ ] File `.env` đã config đầy đủ
- [ ] `pnpm install` thành công
- [ ] `pnpm prisma:generate` thành công
- [ ] `pnpm dev` chạy không lỗi
- [ ] `curl http://localhost:3001/health` trả về OK
- [ ] Prisma Studio mở được: `pnpm prisma:studio`

## 🎓 Next Steps

Sau khi setup thành công:

1. ✅ Đọc [Phase 1 Guide](./04-phase1-guide.md) để hiểu code
2. ✅ Đọc [Genkit Guide](./05-genkit-guide.md) để hiểu AI framework
3. ✅ Test API với sample PDF
4. ✅ Integrate với Frontend
5. ✅ Implement Phase 2 theo [Phase 2 Solution](./06-phase2-solution.md)

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)

Happy coding! 🚀
