#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# CUBE OmniFill v7.0.0 - Deployment Script
# Usage: ./scripts/deploy.sh [vercel|railway|docker]
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        log_info "Copy .env.production.example and fill in your values"
        exit 1
    fi
    
    # Check for placeholder values
    if grep -q "YOUR_" .env.production; then
        log_warning "Found placeholder values in .env.production"
        log_warning "Make sure to replace all YOUR_* values before deploying to production"
    fi
    
    # Run build
    log_info "Running build..."
    npm run build
    
    # Run tests
    log_info "Running tests..."
    npm test
    
    # Check for vulnerabilities
    log_info "Checking for vulnerabilities..."
    npm audit --audit-level=high || true
    
    log_success "Pre-deployment checks passed!"
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    # Deploy
    vercel --prod
    
    log_success "Deployed to Vercel!"
}

# Deploy to Railway
deploy_railway() {
    log_info "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_info "Installing Railway CLI..."
        npm i -g @railway/cli
    fi
    
    # Check if logged in
    railway whoami || railway login
    
    # Deploy
    railway up
    
    log_success "Deployed to Railway!"
}

# Deploy with Docker
deploy_docker() {
    log_info "Building and deploying with Docker..."
    
    # Build images
    docker-compose build
    
    # Start services
    docker-compose up -d
    
    # Wait for health check
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    curl -f http://localhost:3000/api/health || log_error "Health check failed!"
    
    log_success "Docker deployment complete!"
}

# Main
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  CUBE OmniFill v7.0.0 - Deployment Script"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    TARGET=${1:-"vercel"}
    
    case $TARGET in
        "vercel")
            pre_deploy_checks
            deploy_vercel
            ;;
        "railway")
            pre_deploy_checks
            deploy_railway
            ;;
        "docker")
            pre_deploy_checks
            deploy_docker
            ;;
        "check")
            pre_deploy_checks
            log_success "All checks passed! Ready to deploy."
            ;;
        *)
            log_error "Unknown deployment target: $TARGET"
            echo ""
            echo "Usage: ./scripts/deploy.sh [vercel|railway|docker|check]"
            echo ""
            echo "Options:"
            echo "  vercel   - Deploy frontend to Vercel (default)"
            echo "  railway  - Deploy full stack to Railway"
            echo "  docker   - Deploy locally with Docker"
            echo "  check    - Run pre-deployment checks only"
            exit 1
            ;;
    esac
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Deployment Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

main "$@"
