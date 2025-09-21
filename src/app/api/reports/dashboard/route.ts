import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'this-month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFrom: Date
    let dateTo: Date

    if (startDate && endDate) {
      dateFrom = startOfDay(new Date(startDate))
      dateTo = endOfDay(new Date(endDate))
    } else {
      const now = new Date()
      switch (period) {
        case 'today':
          dateFrom = startOfDay(now)
          dateTo = endOfDay(now)
          break
        case 'this-week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          dateFrom = startOfDay(startOfWeek)
          dateTo = endOfDay(new Date())
          break
        case 'this-month':
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
          break
        case 'this-quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          dateFrom = startOfDay(quarterStart)
          dateTo = endOfDay(now)
          break
        case 'this-year':
          dateFrom = startOfYear(now)
          dateTo = endOfYear(now)
          break
        default:
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
      }
    }

    // Generate comprehensive dashboard data
    const dashboardData = await generateDashboardData(dateFrom, dateTo)
    
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error generating dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to generate dashboard data' },
      { status: 500 }
    )
  }
}

async function generateDashboardData(dateFrom: Date, dateTo: Date) {
  // Key Performance Indicators (KPIs)
  const kpis = await generateKPIs(dateFrom, dateTo)
  
  // Revenue trends
  const revenueTrends = await generateRevenueTrends(dateFrom, dateTo)
  
  // Sales analytics
  const salesAnalytics = await generateSalesAnalytics(dateFrom, dateTo)
  
  // Inventory insights
  const inventoryInsights = await generateInventoryInsights()
  
  // Customer insights
  const customerInsights = await generateCustomerInsights(dateFrom, dateTo)
  
  // Financial health
  const financialHealth = await generateFinancialHealth(dateFrom, dateTo)

  return {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    kpis,
    revenueTrends,
    salesAnalytics,
    inventoryInsights,
    customerInsights,
    financialHealth,
    lastUpdated: new Date(),
  }
}

async function generateKPIs(dateFrom: Date, dateTo: Date) {
  // Calculate previous period for comparison
  const periodDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
  const previousPeriodStart = subDays(dateFrom, periodDays)
  const previousPeriodEnd = subDays(dateTo, periodDays)

  // Current period metrics
  const [
    currentSales,
    currentPurchases,
    currentExpenses,
    currentIncome,
    outstandingInvoices,
    inventoryValue,
    activeCustomers,
    activeSuppliers
  ] = await Promise.all([
    // Sales
    prisma.transaction.aggregate({
      where: { type: 'SALE', date: { gte: dateFrom, lte: dateTo } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Purchases
    prisma.transaction.aggregate({
      where: { type: 'PURCHASE', date: { gte: dateFrom, lte: dateTo } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Expenses
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE', date: { gte: dateFrom, lte: dateTo } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Income
    prisma.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: dateFrom, lte: dateTo } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Outstanding invoices
    prisma.invoice.aggregate({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    // Inventory value (simplified calculation)
    prisma.item.aggregate({
      where: { isActive: true, isService: false },
      _sum: { stockQuantity: true },
    }),
    // Active customers (with transactions in period)
    prisma.transaction.groupBy({
      by: ['customerId'],
      where: { type: 'SALE', date: { gte: dateFrom, lte: dateTo }, customerId: { not: null } },
    }),
    // Active suppliers (with transactions in period)
    prisma.transaction.groupBy({
      by: ['supplierId'],
      where: { type: 'PURCHASE', date: { gte: dateFrom, lte: dateTo }, supplierId: { not: null } },
    }),
  ])

  // Previous period metrics for comparison
  const [previousSales, previousPurchases, previousExpenses, previousIncome] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'SALE', date: { gte: previousPeriodStart, lte: previousPeriodEnd } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { type: 'PURCHASE', date: { gte: previousPeriodStart, lte: previousPeriodEnd } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE', date: { gte: previousPeriodStart, lte: previousPeriodEnd } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: previousPeriodStart, lte: previousPeriodEnd } },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ])

  // Calculate inventory value (using cost price where available)
  const inventoryItems = await prisma.item.findMany({
    where: { isActive: true, isService: false, stockQuantity: { gt: 0 } },
    select: { stockQuantity: true, costPrice: true, unitPrice: true },
  })
  
  const totalInventoryValue = inventoryItems.reduce((total, item) => {
    const price = item.costPrice || item.unitPrice
    return total + (item.stockQuantity * Number(price))
  }, 0)

  // Calculate growth rates
  const salesGrowth = previousSales._sum.totalAmount 
    ? ((Number(currentSales._sum.totalAmount || 0) - Number(previousSales._sum.totalAmount || 0)) / Number(previousSales._sum.totalAmount || 1)) * 100
    : 0

  const totalRevenue = Number(currentSales._sum.totalAmount || 0) + Number(currentIncome._sum.totalAmount || 0)
  const totalCosts = Number(currentPurchases._sum.totalAmount || 0) + Number(currentExpenses._sum.totalAmount || 0)
  const grossProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue: {
      value: totalRevenue,
      growth: salesGrowth,
      trend: salesGrowth > 0 ? 'up' : salesGrowth < 0 ? 'down' : 'stable',
    },
    totalSales: {
      value: Number(currentSales._sum.totalAmount || 0),
      count: currentSales._count,
      growth: salesGrowth,
      trend: salesGrowth > 0 ? 'up' : salesGrowth < 0 ? 'down' : 'stable',
    },
    grossProfit: {
      value: grossProfit,
      margin: profitMargin,
      trend: profitMargin > 20 ? 'up' : profitMargin > 10 ? 'stable' : 'down',
    },
    outstandingInvoices: {
      value: Number(outstandingInvoices._sum.balanceAmount || 0),
      count: outstandingInvoices._count,
      trend: outstandingInvoices._count > 10 ? 'down' : 'stable',
    },
    inventoryValue: {
      value: totalInventoryValue,
      items: inventoryValue._sum.stockQuantity || 0,
      trend: 'stable', // Would need historical data for trend
    },
    activeCustomers: {
      count: activeCustomers.length,
      trend: 'stable', // Would need historical data for trend
    },
    activeSuppliers: {
      count: activeSuppliers.length,
      trend: 'stable', // Would need historical data for trend
    },
    totalExpenses: {
      value: Number(currentExpenses._sum.totalAmount || 0),
      count: currentExpenses._count,
    },
  }
}

async function generateRevenueTrends(dateFrom: Date, dateTo: Date) {
  // Daily revenue trend
  const dailyRevenue = await prisma.$queryRaw`
    SELECT
      DATE("date") as revenue_date,
      SUM(CASE WHEN "type" = 'SALE' THEN "totalAmount" ELSE 0 END)::decimal as sales,
      SUM(CASE WHEN "type" = 'INCOME' THEN "totalAmount" ELSE 0 END)::decimal as other_income,
      SUM(CASE WHEN "type" IN ('SALE', 'INCOME') THEN "totalAmount" ELSE 0 END)::decimal as total_revenue,
      COUNT(CASE WHEN "type" = 'SALE' THEN 1 END)::int as sales_count
    FROM transactions
    WHERE "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
      AND "type" IN ('SALE', 'INCOME')
    GROUP BY DATE("date")
    ORDER BY revenue_date
  ` as Array<{
    revenue_date: Date
    sales: number
    other_income: number
    total_revenue: number
    sales_count: number
  }>

  // Monthly comparison (if period spans multiple months)
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', "date") as month,
      SUM(CASE WHEN "type" = 'SALE' THEN "totalAmount" ELSE 0 END)::decimal as sales,
      SUM(CASE WHEN "type" = 'INCOME' THEN "totalAmount" ELSE 0 END)::decimal as other_income,
      SUM(CASE WHEN "type" IN ('SALE', 'INCOME') THEN "totalAmount" ELSE 0 END)::decimal as total_revenue,
      COUNT(CASE WHEN "type" = 'SALE' THEN 1 END)::int as sales_count
    FROM transactions
    WHERE "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
      AND "type" IN ('SALE', 'INCOME')
    GROUP BY DATE_TRUNC('month', "date")
    ORDER BY month
  ` as Array<{
    month: Date
    sales: number
    other_income: number
    total_revenue: number
    sales_count: number
  }>

  return {
    daily: dailyRevenue.map(day => ({
      date: day.revenue_date,
      sales: Number(day.sales),
      otherIncome: Number(day.other_income),
      totalRevenue: Number(day.total_revenue),
      salesCount: day.sales_count,
    })),
    monthly: monthlyRevenue.map(month => ({
      month: month.month,
      monthName: format(month.month, 'MMM yyyy'),
      sales: Number(month.sales),
      otherIncome: Number(month.other_income),
      totalRevenue: Number(month.total_revenue),
      salesCount: month.sales_count,
    })),
  }
}

async function generateSalesAnalytics(dateFrom: Date, dateTo: Date) {
  // Sales by payment method
  const salesByPaymentMethod = await prisma.transaction.groupBy({
    by: ['paymentMethod'],
    where: {
      type: 'SALE',
      date: { gte: dateFrom, lte: dateTo },
      paymentMethod: { not: null },
    },
    _sum: { totalAmount: true },
    _count: true,
  })

  // Top selling items
  const topSellingItems = await prisma.$queryRaw`
    SELECT
      i.id,
      i.name,
      i.sku,
      SUM(ti.quantity)::int as total_quantity,
      SUM(ti."totalAmount")::decimal as total_revenue,
      COUNT(ti.id)::int as sales_count,
      AVG(ti."unitPrice")::decimal as avg_price
    FROM transaction_items ti
    JOIN items i ON ti."itemId" = i.id
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
    GROUP BY i.id, i.name, i.sku
    ORDER BY total_revenue DESC
    LIMIT 10
  ` as Array<{
    id: string
    name: string
    sku: string | null
    total_quantity: number
    total_revenue: number
    sales_count: number
    avg_price: number
  }>

  // Sales performance by hour
  const salesByHour = await prisma.$queryRaw`
    SELECT
      EXTRACT(HOUR FROM "date") as hour,
      COUNT(*)::int as transaction_count,
      SUM("totalAmount")::decimal as total_amount
    FROM transactions
    WHERE "type" = 'SALE'
      AND "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
    GROUP BY EXTRACT(HOUR FROM "date")
    ORDER BY hour
  ` as Array<{
    hour: number
    transaction_count: number
    total_amount: number
  }>

  return {
    paymentMethods: salesByPaymentMethod.map(method => ({
      method: method.paymentMethod,
      amount: Number(method._sum.totalAmount || 0),
      count: method._count,
    })),
    topSellingItems: topSellingItems.map(item => ({
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      quantitySold: item.total_quantity,
      revenue: Number(item.total_revenue),
      salesCount: item.sales_count,
      avgPrice: Number(item.avg_price),
    })),
    hourlyPattern: Array.from({ length: 24 }, (_, hour) => {
      const data = salesByHour.find(h => h.hour === hour)
      return {
        hour,
        transactions: data ? data.transaction_count : 0,
        amount: data ? Number(data.total_amount) : 0,
      }
    }),
  }
}

async function generateInventoryInsights() {
  // Low stock items
  const lowStockItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false,
      stockQuantity: { lte: prisma.item.fields.minStock },
    },
  })

  // Out of stock items
  const outOfStockItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false,
      stockQuantity: { lte: 0 },
    },
  })

  // Total items
  const totalItems = await prisma.item.count({
    where: { isActive: true, isService: false },
  })

  // Top categories by item count
  const topCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          items: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: {
      items: {
        _count: 'desc',
      },
    },
    take: 5,
  })

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    stockHealthPercentage: totalItems > 0 ? ((totalItems - lowStockItems) / totalItems) * 100 : 100,
    topCategories: topCategories.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      itemCount: category._count.items,
    })),
  }
}

async function generateCustomerInsights(dateFrom: Date, dateTo: Date) {
  // New customers in period
  const newCustomers = await prisma.party.count({
    where: {
      type: 'CUSTOMER',
      createdAt: { gte: dateFrom, lte: dateTo },
    },
  })

  // Total active customers
  const totalCustomers = await prisma.party.count({
    where: { type: 'CUSTOMER', isActive: true },
  })

  // Customers with outstanding invoices
  const customersWithOutstanding = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: {
      status: { in: ['SENT', 'OVERDUE'] },
      balanceAmount: { gt: 0 },
    },
  })

  // Top customers by revenue
  const topCustomers = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      SUM(t."totalAmount")::decimal as total_revenue,
      COUNT(t.id)::int as transaction_count
    FROM transactions t
    JOIN parties p ON t."customerId" = p.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND p."type" = 'CUSTOMER'
    GROUP BY p.id, p.name
    ORDER BY total_revenue DESC
    LIMIT 5
  ` as Array<{
    id: string
    name: string
    total_revenue: number
    transaction_count: number
  }>

  return {
    totalCustomers,
    newCustomers,
    customersWithOutstanding: customersWithOutstanding.length,
    topCustomers: topCustomers.map(customer => ({
      customerId: customer.id,
      customerName: customer.name,
      revenue: Number(customer.total_revenue),
      transactionCount: customer.transaction_count,
    })),
  }
}

async function generateFinancialHealth(dateFrom: Date, dateTo: Date) {
  // Cash flow indicators
  const cashInflow = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: dateFrom, lte: dateTo },
      status: 'COMPLETED',
    },
    _sum: { amount: true },
  })

  const cashOutflow = await prisma.transaction.aggregate({
    where: {
      type: { in: ['PURCHASE', 'EXPENSE'] },
      date: { gte: dateFrom, lte: dateTo },
      paymentStatus: 'COMPLETED',
    },
    _sum: { totalAmount: true },
  })

  // Accounts receivable aging
  const currentReceivables = await prisma.invoice.aggregate({
    where: {
      status: { in: ['SENT', 'OVERDUE'] },
      dueDate: { gte: new Date() },
    },
    _sum: { balanceAmount: true },
  })

  const overdueReceivables = await prisma.invoice.aggregate({
    where: {
      status: 'OVERDUE',
      dueDate: { lt: new Date() },
    },
    _sum: { balanceAmount: true },
  })

  const netCashFlow = Number(cashInflow._sum.amount || 0) - Number(cashOutflow._sum.totalAmount || 0)
  const totalReceivables = Number(currentReceivables._sum.balanceAmount || 0) + Number(overdueReceivables._sum.balanceAmount || 0)

  return {
    cashFlow: {
      inflow: Number(cashInflow._sum.amount || 0),
      outflow: Number(cashOutflow._sum.totalAmount || 0),
      net: netCashFlow,
      trend: netCashFlow > 0 ? 'positive' : netCashFlow < 0 ? 'negative' : 'neutral',
    },
    accountsReceivable: {
      current: Number(currentReceivables._sum.balanceAmount || 0),
      overdue: Number(overdueReceivables._sum.balanceAmount || 0),
      total: totalReceivables,
      overduePercentage: totalReceivables > 0 ? (Number(overdueReceivables._sum.balanceAmount || 0) / totalReceivables) * 100 : 0,
    },
    healthScore: Math.max(0, Math.min(100, 
      (netCashFlow > 0 ? 40 : 0) + 
      (totalReceivables > 0 ? Math.max(0, 40 - ((Number(overdueReceivables._sum.balanceAmount || 0) / totalReceivables) * 40)) : 40) +
      20 // Base score
    )),
  }
}
