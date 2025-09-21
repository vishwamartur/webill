# WeBill Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Deployment Commands

### Manual Deployment
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### CI/CD Deployment
- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch (requires approval)

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:pass@host:5432/webill"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
```

### Optional
```env
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
SNYK_TOKEN="your-snyk-token"
```

## Testing

### Run All Tests
```bash
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:smoke          # Smoke tests
npm run test:load           # Load tests
```

### Code Quality
```bash
npm run lint               # ESLint
npm run type-check         # TypeScript
npm run format             # Prettier
```

## Database Operations

```bash
npm run db:migrate         # Run migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio
npm run db:seed            # Seed database
```

## Monitoring

### Health Check
- **URL**: `/api/health`
- **Status**: Returns 200 if healthy

### Performance
- **Lighthouse**: Automated performance testing
- **k6**: Load testing with realistic scenarios

### Security
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Advanced security analysis
- **OWASP ZAP**: Web application security testing

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

#### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

#### Deployment Issues
```bash
# Check Vercel logs
vercel logs

# Check deployment status
vercel ls

# Rollback deployment
vercel promote <previous-deployment-id>
```

## Support

- **Documentation**: Check this guide and inline comments
- **GitHub Issues**: Report bugs and feature requests
- **Team Chat**: Contact development team for urgent issues
