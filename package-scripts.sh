#!/bin/bash

# DevInsight AI Backend - Setup Script

echo "🚀 DevInsight AI Backend Setup"
echo "================================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm chưa được cài đặt"
    echo "📦 Đang cài đặt pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm đã sẵn sàng"
echo ""

# Install dependencies
echo "📦 Đang cài đặt dependencies..."
pnpm install

echo ""
echo "✅ Dependencies đã được cài đặt"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Tạo file .env từ .env.example..."
    cp .env.example .env
    echo "⚠️  Vui lòng cập nhật GOOGLE_API_KEY trong file .env"
else
    echo "✅ File .env đã tồn tại"
fi

echo ""
echo "🎉 Setup hoàn tất!"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. Cập nhật GOOGLE_API_KEY trong file .env"
echo "2. Tạo PostgreSQL database: createdb devinsight_ai"
echo "3. Chạy migrations: pnpm prisma:migrate"
echo "4. Chạy server: pnpm dev"
echo ""
