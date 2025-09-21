# CI/CD Pipeline Setup Guide

This document provides comprehensive instructions for setting up the CI/CD pipeline for the WeBill billing application.

## Overview

The CI/CD pipeline consists of:
- **Continuous Integration (CI)**: Automated testing, code quality checks, and build verification
- **Continuous Deployment (CD)**: Automated deployment to staging and production environments

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│                 │    │                 │    │                 │
│ • Feature work  │    │ • Auto deploy   │    │ • Manual deploy │
│ • Pull requests │    │ • Integration   │    │ • Approval gate │
│ • Unit tests    │    │ • E2E tests     │    │ • Health checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### 1. GitHub Repository Setup
- Repository with admin access
- Branch protection rules configured
- GitHub Actions enabled

### 2. Required Accounts
- **Vercel Account**: For hosting and deployment
- **PostgreSQL Database**: For staging and production
- **Slack Workspace**: For notifications (optional)
- **Snyk Account**: For security scanning (optional)

### 3. Local Development Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma migrate dev
npx prisma db seed
```

## GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets

#### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Database Configuration
```
STAGING_DATABASE_URL=postgresql://user:pass@staging-host:5432/webill_staging
PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-host:5432/webill_production
```

#### Optional Integrations
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SNYK_TOKEN=your_snyk_token
CODECOV_TOKEN=your_codecov_token
```

### How to Get Vercel Credentials

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login and Link Project**:
   ```bash
   vercel login
   vercel link
   ```

3. **Get Organization and Project IDs**:
   ```bash
   vercel project ls
   ```

4. **Generate Token**:
   - Go to Vercel Dashboard → Settings → Tokens
   - Create new token with appropriate permissions

## Branch Protection Rules

Configure the following branch protection rules for `main` and `develop` branches:

### Main Branch (Production)
- ✅ Require a pull request before merging
- ✅ Require approvals (minimum 2)
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Include administrators

### Develop Branch (Staging)
- ✅ Require a pull request before merging
- ✅ Require approvals (minimum 1)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

## Workflow Triggers

### Continuous Integration (`ci.yml`)
- **Triggers**: Push to `main`/`develop`, Pull requests
- **Jobs**: Code quality, security scanning, testing, build verification

### Staging Deployment (`cd-staging.yml`)
- **Triggers**: Push to `develop`, Successful CI completion
- **Jobs**: Deploy to staging, health checks, performance monitoring

### Production Deployment (`cd-production.yml`)
- **Triggers**: Push to `main`, Manual workflow dispatch
- **Jobs**: Pre-deployment checks, manual approval, production deployment

## Environment Setup

### Staging Environment
- **URL**: `https://webill-staging.vercel.app`
- **Database**: Staging PostgreSQL instance
- **Purpose**: Integration testing, stakeholder review

### Production Environment
- **URL**: `https://webill.vercel.app`
- **Database**: Production PostgreSQL instance
- **Purpose**: Live application serving real users

## Testing Strategy

### Unit Tests
- **Framework**: Jest + Testing Library
- **Coverage**: Minimum 70% code coverage
- **Location**: `tests/unit/`

### Integration Tests
- **Framework**: Jest + Supertest
- **Database**: Test database with migrations
- **Location**: `tests/integration/`

### End-to-End Tests
- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Location**: `tests/e2e/`

### Performance Tests
- **Framework**: k6
- **Metrics**: Response time, throughput, error rate
- **Location**: `tests/load/`

## Monitoring and Alerts

### Health Checks
- **Endpoint**: `/api/health`
- **Checks**: Database connectivity, system resources
- **Frequency**: Every deployment

### Performance Monitoring
- **Tool**: Lighthouse CI
- **Metrics**: Performance, Accessibility, SEO, Best Practices
- **Thresholds**: Performance > 80, Accessibility > 90

### Security Scanning
- **Tools**: npm audit, Snyk, OWASP ZAP
- **Frequency**: Every CI run
- **Thresholds**: No high/critical vulnerabilities

## Deployment Process

### Staging Deployment
1. Developer pushes to `develop` branch
2. CI pipeline runs automatically
3. On CI success, staging deployment triggers
4. Application deployed to staging environment
5. Database migrations run automatically
6. Health checks and smoke tests execute
7. Slack notification sent (if configured)

### Production Deployment
1. Create pull request from `develop` to `main`
2. Code review and approval process
3. Merge to `main` branch
4. Pre-deployment checks run
5. **Manual approval required** 🔒
6. Production deployment executes
7. Database backup created
8. Database migrations run
9. Health checks and monitoring setup
10. Success notification sent

## Rollback Procedures

### Automatic Rollback
- Triggers on deployment failure
- Reverts to previous Vercel deployment
- Restores database backup (if needed)
- Sends alert notifications

### Manual Rollback
```bash
# Get deployment list
vercel ls --token=$VERCEL_TOKEN

# Promote previous deployment
vercel promote <deployment-id> --token=$VERCEL_TOKEN
```

## Troubleshooting

### Common Issues

#### CI Pipeline Failures
1. **TypeScript errors**: Check type definitions and imports
2. **Test failures**: Review test logs and fix failing tests
3. **Build failures**: Check Next.js configuration and dependencies

#### Deployment Issues
1. **Database connection**: Verify DATABASE_URL secrets
2. **Migration failures**: Check Prisma schema and migration files
3. **Environment variables**: Ensure all required secrets are set

#### Performance Issues
1. **Slow API responses**: Check database queries and indexing
2. **Large bundle size**: Analyze and optimize JavaScript bundles
3. **Memory issues**: Monitor application memory usage

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review Vercel deployment logs
- Monitor application health checks
- Contact team leads for deployment approvals

## Maintenance

### Regular Tasks
- **Weekly**: Review security scan results
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize CI/CD pipeline performance

### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Run tests after updates
npm test
```

This CI/CD setup ensures reliable, secure, and efficient deployment of the WeBill application while maintaining high code quality and system reliability.
