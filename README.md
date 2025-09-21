# WeBill - Comprehensive Billing Application

![WeBill Logo](https://img.shields.io/badge/WeBill-Billing%20Solution-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)

WeBill is a modern, comprehensive web-based billing application designed to streamline business operations with powerful transaction management, professional invoice generation, and advanced financial tracking capabilities. Built with cutting-edge technologies, WeBill provides businesses with a complete solution for managing customers, suppliers, inventory, sales, purchases, and financial reporting.

## 🚀 Project Overview

WeBill offers a complete billing ecosystem that includes:

- **Master Data Management**: Comprehensive management of parties (customers, suppliers, vendors), items/products, and hierarchical categories
- **Transaction Management**: Full-featured sales, purchase, expense, and income tracking with real-time inventory updates
- **Invoice Generation**: Professional invoice creation with customizable templates, automated calculations, and PDF export
- **Financial Analytics**: Advanced reporting, KPIs, aging reports, and cash flow projections
- **User Experience**: Responsive design with intuitive navigation and modern UI components

## ✨ Features Implemented

### 🏢 Master Data Management
- **Parties Management**
  - Customer, supplier, and vendor profiles with contact details
  - Payment terms and transaction history tracking
  - Advanced search and filtering capabilities
  - Bulk operations and data import/export

- **Items Management**
  - Product and service catalog with SKU tracking
  - Inventory management with stock levels
  - Pricing management (cost price, selling price)
  - Tax rate configuration per item
  - Service vs. product classification

- **Category Management**
  - Hierarchical category system with parent-child relationships
  - Bulk category operations
  - Category-based item organization and filtering

### 💰 Transaction Management
- **Sales Transactions**
  - Customer order management with line items
  - Real-time inventory updates (stock decrements)
  - Tax calculations and discount management
  - Payment method selection and status tracking
  - Transaction receipt generation

- **Purchase Transactions**
  - Supplier purchase orders with approval workflows
  - Inventory management (stock increments)
  - Cost price tracking separate from selling prices
  - Purchase returns and credit notes support
  - Goods received tracking

- **Expenses & Income Tracking**
  - Category-based expense classification
  - Income stream tracking beyond sales
  - Receipt/document attachment with drag-and-drop
  - Payment method and reference tracking
  - Recurring transaction support

### 📄 Invoice Generation System
- **Professional Invoice Creation**
  - Convert sales transactions to invoices
  - Standalone invoice creation
  - Multiple professional templates (Modern, Classic, Minimal)
  - Customizable company branding and layouts

- **Advanced Invoice Features**
  - Multi-currency support with exchange rates
  - Recurring invoice generation (monthly, quarterly, yearly)
  - Payment terms and due date calculations
  - Partial payment tracking with balance management
  - Invoice status management (Draft, Sent, Paid, Overdue, Cancelled)

- **Payment & Reminder System**
  - Automated payment tracking and status updates
  - Payment reminder system with customizable messages
  - Overdue invoice management with aging reports
  - Payment history and audit trails

### 📊 Dashboard & Analytics
- **Executive Dashboard**
  - Key Performance Indicators (KPIs)
  - Revenue and expense summaries
  - Recent transaction overview
  - Quick access to key features

- **Financial Analytics**
  - Invoice aging reports
  - Accounts receivable management
  - Collection efficiency tracking
  - Customer payment analysis
  - Monthly/quarterly revenue trends

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Robust relational database

### Additional Libraries
- **jsPDF & html2canvas** - PDF generation and export
- **date-fns** - Date manipulation utilities
- **Recharts** - Data visualization components
- **clsx & tailwind-merge** - Conditional styling utilities

## 📋 Prerequisites

Before setting up WeBill, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** (v13.0 or higher)
- **Git** for version control

## 🚀 Installation Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vishwamartur/webill.git
cd webill
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory and configure the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/webill"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Email Configuration (for invoice reminders)
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"

# Optional: File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880" # 5MB
```

### 4. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE webill;

# Create user (optional)
CREATE USER webill_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE webill TO webill_user;
```

#### Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: Seed database with sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access WeBill.

## 📖 Usage Guide

### Getting Started

1. **Dashboard Overview**: Access the main dashboard to view KPIs, recent transactions, and quick actions
2. **Master Data Setup**:
   - Create categories for organizing items
   - Add customers and suppliers in the Parties section
   - Set up your product/service catalog in Items management

### Key Operations

#### Creating a Sales Transaction
1. Navigate to **Transactions > Sales**
2. Click **"New Sale"**
3. Select customer using auto-complete search
4. Add line items with quantities and pricing
5. Review tax calculations and discounts
6. Choose payment method and status
7. Save the transaction

#### Generating an Invoice
1. Go to **Financial > Invoices**
2. Click **"New Invoice"**
3. Option 1: Import from existing sales transaction
4. Option 2: Create standalone invoice
5. Customize invoice template and terms
6. Add billing/shipping addresses
7. Review and save as Draft or send immediately

#### Managing Inventory
1. Access **Master Data > Items**
2. View current stock levels
3. Stock automatically updates with sales/purchases
4. Set reorder levels and track inventory movements

#### Financial Reporting
1. Visit the **Dashboard** for overview metrics
2. Use **Invoices** section for aging reports
3. Filter transactions by date, customer, or status
4. Export data for external analysis

## 🔌 API Documentation

WeBill provides comprehensive RESTful API endpoints for all major operations:

### Parties API
```
GET    /api/parties              # List all parties
POST   /api/parties              # Create new party
GET    /api/parties/[id]         # Get party details
PUT    /api/parties/[id]         # Update party
DELETE /api/parties/[id]         # Delete party
```

### Items API
```
GET    /api/items                # List all items
POST   /api/items                # Create new item
GET    /api/items/[id]           # Get item details
PUT    /api/items/[id]           # Update item
DELETE /api/items/[id]           # Delete item
```

### Transactions API
```
GET    /api/transactions         # List transactions
POST   /api/transactions         # Create transaction
GET    /api/transactions/[id]    # Get transaction details
PUT    /api/transactions/[id]    # Update transaction
DELETE /api/transactions/[id]    # Delete transaction
```

### Invoices API
```
GET    /api/invoices             # List invoices
POST   /api/invoices             # Create invoice
GET    /api/invoices/[id]        # Get invoice details
PUT    /api/invoices/[id]        # Update invoice
DELETE /api/invoices/[id]        # Delete invoice
POST   /api/invoices/from-transaction  # Create from transaction
PUT    /api/invoices/[id]/status # Update invoice status
POST   /api/invoices/[id]/reminder    # Send payment reminder
GET    /api/invoices/analytics   # Get invoice analytics
```

### Categories API
```
GET    /api/categories           # List categories
POST   /api/categories           # Create category
GET    /api/categories/[id]      # Get category details
PUT    /api/categories/[id]      # Update category
DELETE /api/categories/[id]      # Delete category
```

## 📁 Project Structure

```
webill/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   │   ├── parties/         # Parties CRUD endpoints
│   │   │   ├── items/           # Items CRUD endpoints
│   │   │   ├── categories/      # Categories CRUD endpoints
│   │   │   ├── transactions/    # Transactions CRUD endpoints
│   │   │   └── invoices/        # Invoices CRUD endpoints
│   │   ├── dashboard/           # Dashboard page
│   │   ├── parties/             # Parties management pages
│   │   ├── items/               # Items management pages
│   │   ├── categories/          # Categories management pages
│   │   ├── sales/               # Sales transactions pages
│   │   ├── purchases/           # Purchase transactions pages
│   │   ├── expenses-income/     # Expenses & income pages
│   │   ├── invoices/            # Invoice management pages
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable React components
│   │   ├── forms/               # Form components
│   │   ├── layout/              # Layout components
│   │   ├── ui/                  # UI components
│   │   └── invoices/            # Invoice-specific components
│   ├── lib/                     # Utility libraries
│   │   ├── prisma.ts            # Prisma client configuration
│   │   └── utils.ts             # Utility functions
│   └── generated/               # Generated Prisma types
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Database migration files
├── public/                      # Static assets
├── .env                         # Environment variables
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## 🤝 Contributing Guidelines

We welcome contributions to WeBill! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Follow coding standards**: Use TypeScript, ESLint, and Prettier
3. **Write tests** for new features and bug fixes
4. **Update documentation** for any API or feature changes
5. **Submit a pull request** with a clear description

### Code Standards

- Use **TypeScript** for all new code
- Follow **React best practices** and hooks patterns
- Implement **proper error handling** and validation
- Write **meaningful commit messages**
- Add **JSDoc comments** for complex functions

### Database Changes

- Create **Prisma migrations** for schema changes
- Test migrations on development database
- Update **seed data** if necessary
- Document any breaking changes

### Testing

```bash
# Run all tests
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:smoke          # E2E smoke tests
npm run test:load           # Performance/load tests

# Code quality
npm run lint               # ESLint
npm run type-check         # TypeScript checking
npm run format             # Code formatting

# Build verification
npm run build
```

## 🚀 CI/CD Pipeline

WeBill includes a comprehensive CI/CD pipeline with automated testing, security scanning, and deployment.

### Pipeline Features

- **Continuous Integration**: Automated testing on every pull request
- **Code Quality**: TypeScript, ESLint, and Prettier checks
- **Security Scanning**: Dependency auditing and vulnerability detection
- **Performance Testing**: Lighthouse and load testing
- **Automated Deployment**: Staging and production deployments
- **Health Monitoring**: Post-deployment health checks and alerts

### Deployment Environments

- **Development**: Local development environment
- **Staging**: `https://webill-staging.vercel.app` (auto-deploy from `develop`)
- **Production**: `https://webill.vercel.app` (manual approval required)

### Quick Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (requires approval)
./scripts/deploy.sh production
```

For detailed CI/CD setup instructions, see [CI/CD Setup Guide](docs/CI-CD-SETUP.md).

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, feature requests, or bug reports:

1. **GitHub Issues**: [Create an issue](https://github.com/vishwamartur/webill/issues)
2. **Documentation**: Check this README and inline code comments
3. **Community**: Join discussions in GitHub Discussions

## 🚧 Roadmap

### Upcoming Features
- [ ] Point of Sale (POS) Interface
- [ ] Advanced Reports & Analytics
- [ ] Multi-company Support
- [ ] Mobile Application
- [ ] API Rate Limiting
- [ ] Advanced User Management
- [ ] Integration with Payment Gateways
- [ ] Automated Backup System

### Version History
- **v1.0.0** - Initial release with core billing features
- **v1.1.0** - Invoice generation system
- **v1.2.0** - Advanced analytics and reporting

---

**Built with ❤️ by the WeBill Team**

For more information, visit our [GitHub repository](https://github.com/vishwamartur/webill).
