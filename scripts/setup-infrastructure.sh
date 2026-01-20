#!/bin/bash

# ============================================
# CUBE Elite v6 - Infrastructure Setup Script
# ============================================

set -e

echo "🚀 CUBE Elite v6 - Infrastructure Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys${NC}"
    echo ""
else
    echo -e "${GREEN}✅ .env file exists${NC}"
    echo ""
fi

# Generate secrets if not present
if ! grep -q "JWT_SECRET=generate-with-openssl" .env 2>/dev/null; then
    echo -e "${YELLOW}📝 Generating JWT secret...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" .env
    rm .env.bak
    
    echo -e "${GREEN}✅ Secrets generated${NC}"
    echo ""
fi

# Create docker directory if it doesn't exist
mkdir -p docker

# Start services
echo -e "${GREEN}🐳 Starting Docker services...${NC}"
echo ""

docker-compose up -d postgres redis minio mailhog

echo ""
echo -e "${GREEN}✅ Core services started!${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

until docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-cube} > /dev/null 2>&1; do
    echo -e "${YELLOW}   Still waiting...${NC}"
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Wait for MinIO to be ready
echo -e "${YELLOW}⏳ Waiting for MinIO to be ready...${NC}"
sleep 3

until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo -e "${YELLOW}   Still waiting...${NC}"
    sleep 2
done

echo -e "${GREEN}✅ MinIO is ready${NC}"
echo ""

# Create MinIO buckets
echo -e "${GREEN}📦 Creating MinIO buckets...${NC}"

docker run --rm --network cube_cube-network \
    --entrypoint /bin/sh \
    minio/mc -c "
    mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123} && \
    mc mb myminio/cube-elite-storage --ignore-existing && \
    mc mb myminio/cube-elite-documents --ignore-existing && \
    mc mb myminio/cube-elite-backups --ignore-existing && \
    mc anonymous set download myminio/cube-elite-storage
" || echo -e "${YELLOW}⚠️  Buckets may already exist${NC}"

echo -e "${GREEN}✅ MinIO buckets created${NC}"
echo ""

# Display service URLs
echo ""
echo -e "${GREEN}🎉 Infrastructure Setup Complete!${NC}"
echo "========================================"
echo ""
echo -e "${GREEN}📍 Service URLs:${NC}"
echo ""
echo -e "  PostgreSQL:     localhost:5432"
echo -e "  Database:       ${POSTGRES_DB:-cube_nexum}"
echo -e "  User:           ${POSTGRES_USER:-cube}"
echo ""
echo -e "  Redis:          localhost:6379"
echo ""
echo -e "  MinIO API:      http://localhost:9000"
echo -e "  MinIO Console:  http://localhost:9001"
echo -e "  User:           ${MINIO_ROOT_USER:-minioadmin}"
echo -e "  Password:       ${MINIO_ROOT_PASSWORD:-minioadmin123}"
echo ""
echo -e "  Mailhog SMTP:   localhost:1025"
echo -e "  Mailhog Web:    http://localhost:8025"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo ""
echo "  1. Edit .env and add your OpenAI API key"
echo "  2. Run: npm run dev (to start the development server)"
echo "  3. Open: http://localhost:3000"
echo ""
echo -e "${YELLOW}📚 For more information, see docs/INFRASTRUCTURE.md${NC}"
echo ""
