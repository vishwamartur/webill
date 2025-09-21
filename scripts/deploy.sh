#!/bin/bash

# WeBill Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT environment..."
echo "📅 Timestamp: $TIMESTAMP"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Run: npm install -g vercel"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Run pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        print_warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run type checking
    print_status "Running TypeScript type checking..."
    npx tsc --noEmit
    
    # Run linting
    print_status "Running ESLint..."
    npm run lint
    
    # Run tests
    print_status "Running tests..."
    npm test -- --passWithNoTests
    
    print_success "Pre-deployment checks completed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Set environment variables for build
    if [[ "$ENVIRONMENT" == "production" ]]; then
        export NODE_ENV=production
    else
        export NODE_ENV=staging
    fi
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel ($ENVIRONMENT)..."
    
    # Set Vercel environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        VERCEL_ENV="production"
        VERCEL_FLAGS="--prod"
    else
        VERCEL_ENV="preview"
        VERCEL_FLAGS=""
    fi
    
    # Deploy to Vercel
    DEPLOYMENT_URL=$(vercel deploy $VERCEL_FLAGS --yes)
    
    if [[ $? -eq 0 ]]; then
        print_success "Deployed to: $DEPLOYMENT_URL"
        echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" >> deployment.env
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Set database URL based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ -z "$PRODUCTION_DATABASE_URL" ]]; then
            print_error "PRODUCTION_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL="$PRODUCTION_DATABASE_URL"
    else
        if [[ -z "$STAGING_DATABASE_URL" ]]; then
            print_error "STAGING_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL="$STAGING_DATABASE_URL"
    fi
    
    # Run migrations
    npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Run post-deployment health checks
health_checks() {
    print_status "Running health checks..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Source deployment URL
    if [[ -f deployment.env ]]; then
        source deployment.env
    fi
    
    if [[ -z "$DEPLOYMENT_URL" ]]; then
        print_error "Deployment URL not found"
        exit 1
    fi
    
    # Check health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        print_success "Health check passed"
    else
        print_error "Health check failed (HTTP $HTTP_STATUS)"
        exit 1
    fi
    
    # Check main pages
    PAGES=("/" "/dashboard" "/reports")
    
    for page in "${PAGES[@]}"; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$page")
        if [[ "$HTTP_STATUS" == "200" ]]; then
            print_success "Page $page is accessible"
        else
            print_warning "Page $page returned HTTP $HTTP_STATUS"
        fi
    done
}

# Send notification
send_notification() {
    print_status "Sending deployment notification..."
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        # Source deployment URL
        if [[ -f deployment.env ]]; then
            source deployment.env
        fi
        
        COMMIT_SHA=$(git rev-parse --short HEAD)
        COMMIT_MSG=$(git log -1 --pretty=%B)
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚀 Deployment to $ENVIRONMENT completed!\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"URL\", \"value\": \"$DEPLOYMENT_URL\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$COMMIT_SHA\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$COMMIT_MSG\", \"short\": false}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
        
        print_success "Notification sent to Slack"
    else
        print_warning "SLACK_WEBHOOK_URL not set, skipping notification"
    fi
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Remove temporary files
    rm -f deployment.env
    
    print_success "Cleanup completed"
}

# Main deployment flow
main() {
    echo "=================================="
    echo "🏗️  WeBill Deployment Script"
    echo "=================================="
    
    check_dependencies
    pre_deployment_checks
    build_application
    deploy_to_vercel
    run_migrations
    health_checks
    send_notification
    cleanup
    
    echo "=================================="
    print_success "🎉 Deployment to $ENVIRONMENT completed successfully!"
    echo "=================================="
    
    if [[ -f deployment.env ]]; then
        source deployment.env
        echo "🌐 Application URL: $DEPLOYMENT_URL"
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; cleanup; exit 1' INT TERM

# Run main function
main "$@"
