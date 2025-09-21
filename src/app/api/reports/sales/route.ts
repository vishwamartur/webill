import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
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
        case 'last-month':
          const lastMonth = subMonths(now, 1)
          dateFrom = startOfMonth(lastMonth)
          dateTo = endOfMonth(lastMonth)
          break
        default:
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
      }
    }

    switch (reportType) {
      case 'overview':
        return await generateSalesOverviewReport(dateFrom, dateTo)
      case 'trends':
        return await generateSalesTrendsReport(dateFrom, dateTo)
      case 'customers':
        return await generateCustomerAnalysisReport(dateFrom, dateTo)
      case 'products':
        return await generateProductAnalysisReport(dateFrom, dateTo)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    )
  }
}

async function generateSalesOverviewReport(dateFrom: Date, dateTo: Date) {
  // Overall sales metrics
  const salesMetrics = await prisma.transaction.aggregate({
    where: {
      type: 'SALE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    _sum: {
      totalAmount: true,
      taxAmount: true,
      discountAmount: true,
    },
    _count: true,
    _avg: {
      totalAmount: true,
    },
  })

  // Sales by payment method
  const salesByPaymentMethod = await prisma.transaction.groupBy({
    by: ['paymentMethod'],
    where: {
      type: 'SALE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      paymentMethod: {
        not: null,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  // Sales by payment status
  const salesByPaymentStatus = await prisma.transaction.groupBy({
    by: ['paymentStatus'],
    where: {
      type: 'SALE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  // Daily sales trend
  const dailySales = await prisma.$queryRaw`
    SELECT
      DATE("date") as sale_date,
      COUNT(*)::int as transaction_count,
      SUM("totalAmount")::decimal as total_amount
    FROM transactions
    WHERE "type" = 'SALE'
      AND "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
    GROUP BY DATE("date")
    ORDER BY sale_date
  ` as Array<{
    sale_date: Date
    transaction_count: number
    total_amount: number
  }>

  // Compare with previous period
  const periodDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
  const previousPeriodStart = subDays(dateFrom, periodDays)
  const previousPeriodEnd = subDays(dateTo, periodDays)

  const previousPeriodMetrics = await prisma.transaction.aggregate({
    where: {
      type: 'SALE',
      date: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    overview: {
      totalSales: salesMetrics._sum.totalAmount || 0,
      totalTransactions: salesMetrics._count,
      averageOrderValue: salesMetrics._avg.totalAmount || 0,
      totalTax: salesMetrics._sum.taxAmount || 0,
      totalDiscount: salesMetrics._sum.discountAmount || 0,
    },
    comparison: {
      previousPeriod: {
        totalSales: previousPeriodMetrics._sum.totalAmount || 0,
        totalTransactions: previousPeriodMetrics._count,
      },
      growth: {
        salesGrowth: previousPeriodMetrics._sum.totalAmount 
          ? ((salesMetrics._sum.totalAmount || 0) - (previousPeriodMetrics._sum.totalAmount || 0)) / (previousPeriodMetrics._sum.totalAmount || 1) * 100
          : 0,
        transactionGrowth: previousPeriodMetrics._count
          ? (salesMetrics._count - previousPeriodMetrics._count) / previousPeriodMetrics._count * 100
          : 0,
      },
    },
    breakdown: {
      byPaymentMethod: salesByPaymentMethod.map(item => ({
        method: item.paymentMethod,
        amount: item._sum.totalAmount || 0,
        count: item._count,
        percentage: salesMetrics._sum.totalAmount 
          ? ((item._sum.totalAmount || 0) / (salesMetrics._sum.totalAmount || 1)) * 100
          : 0,
      })),
      byPaymentStatus: salesByPaymentStatus.map(item => ({
        status: item.paymentStatus,
        amount: item._sum.totalAmount || 0,
        count: item._count,
        percentage: salesMetrics._sum.totalAmount 
          ? ((item._sum.totalAmount || 0) / (salesMetrics._sum.totalAmount || 1)) * 100
          : 0,
      })),
    },
    trends: {
      daily: dailySales.map(day => ({
        date: day.sale_date,
        amount: Number(day.total_amount),
        transactions: day.transaction_count,
      })),
    },
  }

  return NextResponse.json(report)
}

async function generateSalesTrendsReport(dateFrom: Date, dateTo: Date) {
  // Hourly sales pattern
  const hourlySales = await prisma.$queryRaw`
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

  // Weekly sales pattern
  const weeklySales = await prisma.$queryRaw`
    SELECT
      EXTRACT(DOW FROM "date") as day_of_week,
      COUNT(*)::int as transaction_count,
      SUM("totalAmount")::decimal as total_amount
    FROM transactions
    WHERE "type" = 'SALE'
      AND "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
    GROUP BY EXTRACT(DOW FROM "date")
    ORDER BY day_of_week
  ` as Array<{
    day_of_week: number
    transaction_count: number
    total_amount: number
  }>

  // Monthly sales pattern (if date range spans multiple months)
  const monthlySales = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', "date") as month,
      COUNT(*)::int as transaction_count,
      SUM("totalAmount")::decimal as total_amount
    FROM transactions
    WHERE "type" = 'SALE'
      AND "date" >= ${dateFrom}
      AND "date" <= ${dateTo}
    GROUP BY DATE_TRUNC('month', "date")
    ORDER BY month
  ` as Array<{
    month: Date
    transaction_count: number
    total_amount: number
  }>

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    patterns: {
      hourly: Array.from({ length: 24 }, (_, hour) => {
        const data = hourlySales.find(h => h.hour === hour)
        return {
          hour,
          amount: data ? Number(data.total_amount) : 0,
          transactions: data ? data.transaction_count : 0,
        }
      }),
      weekly: Array.from({ length: 7 }, (_, day) => {
        const data = weeklySales.find(w => w.day_of_week === day)
        return {
          day: day,
          dayName: dayNames[day],
          amount: data ? Number(data.total_amount) : 0,
          transactions: data ? data.transaction_count : 0,
        }
      }),
      monthly: monthlySales.map(month => ({
        month: month.month,
        monthName: format(month.month, 'MMM yyyy'),
        amount: Number(month.total_amount),
        transactions: month.transaction_count,
      })),
    },
  }

  return NextResponse.json(report)
}

async function generateCustomerAnalysisReport(dateFrom: Date, dateTo: Date) {
  // Top customers by sales value
  const topCustomers = await prisma.transaction.groupBy({
    by: ['customerId'],
    where: {
      type: 'SALE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      customerId: {
        not: null,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
    _avg: {
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc',
      },
    },
    take: 10,
  })

  // Get customer details
  const customerIds = topCustomers.map(c => c.customerId).filter(Boolean) as string[]
  const customers = await prisma.party.findMany({
    where: {
      id: {
        in: customerIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
    },
  })

  // Customer acquisition (new customers in period)
  const newCustomers = await prisma.party.count({
    where: {
      type: 'CUSTOMER',
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  })

  // Customer retention (customers who made repeat purchases)
  const repeatCustomers = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT customer_id)::int as repeat_customers
    FROM (
      SELECT customer_id, COUNT(*) as purchase_count
      FROM transactions 
      WHERE type = 'SALE' 
        AND customer_id IS NOT NULL
        AND date >= ${dateFrom} 
        AND date <= ${dateTo}
      GROUP BY customer_id
      HAVING COUNT(*) > 1
    ) as repeat_purchases
  ` as Array<{ repeat_customers: number }>

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    topCustomers: topCustomers.map(customer => {
      const customerInfo = customers.find(c => c.id === customer.customerId)
      return {
        customerId: customer.customerId,
        customerName: customerInfo?.name || 'Unknown',
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phone,
        customerCity: customerInfo?.city,
        totalSales: customer._sum.totalAmount || 0,
        totalTransactions: customer._count,
        averageOrderValue: customer._avg.totalAmount || 0,
      }
    }),
    metrics: {
      newCustomers,
      repeatCustomers: repeatCustomers[0]?.repeat_customers || 0,
      totalActiveCustomers: topCustomers.length,
    },
  }

  return NextResponse.json(report)
}

async function generateProductAnalysisReport(dateFrom: Date, dateTo: Date) {
  // Top selling products
  const topProducts = await prisma.transactionItem.groupBy({
    by: ['itemId'],
    where: {
      transaction: {
        type: 'SALE',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    },
    _sum: {
      quantity: true,
      totalAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: 'desc',
      },
    },
    take: 20,
  })

  // Get product details
  const productIds = topProducts.map(p => p.itemId)
  const products = await prisma.item.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      unitPrice: true,
      costPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  // Product categories performance
  const categoryPerformance = await prisma.$queryRaw`
    SELECT
      c.name as category_name,
      COUNT(ti.id)::int as total_sales,
      SUM(ti.quantity)::int as total_quantity,
      SUM(ti."totalAmount")::decimal as total_amount
    FROM transaction_items ti
    JOIN items i ON ti."itemId" = i.id
    JOIN categories c ON i."categoryId" = c.id
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
    GROUP BY c.id, c.name
    ORDER BY total_amount DESC
  ` as Array<{
    category_name: string
    total_sales: number
    total_quantity: number
    total_amount: number
  }>

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    topProducts: topProducts.map(product => {
      const productInfo = products.find(p => p.id === product.itemId)
      const revenue = product._sum.totalAmount || 0
      const quantity = product._sum.quantity || 0
      const costPrice = productInfo?.costPrice || 0
      const profit = revenue - (Number(costPrice) * quantity)
      
      return {
        itemId: product.itemId,
        productName: productInfo?.name || 'Unknown',
        sku: productInfo?.sku,
        category: productInfo?.category?.name,
        unitPrice: productInfo?.unitPrice || 0,
        costPrice: productInfo?.costPrice || 0,
        quantitySold: quantity,
        totalRevenue: revenue,
        totalProfit: profit,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
        salesCount: product._count,
      }
    }),
    categoryPerformance: categoryPerformance.map(category => ({
      categoryName: category.category_name,
      totalSales: category.total_sales,
      totalQuantity: category.total_quantity,
      totalAmount: Number(category.total_amount),
    })),
  }

  return NextResponse.json(report)
}
