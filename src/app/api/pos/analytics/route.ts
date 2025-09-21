import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Parse the date and create start/end of day
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get all POS transactions for the date (SALE transactions with COMPLETED payment status)
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'SALE',
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate today's sales summary
    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0)
    const totalTransactions = transactions.length
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0
    const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

    // Calculate payment method breakdown
    const paymentMethodStats = transactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod || 'UNKNOWN'
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 }
      }
      acc[method].count += 1
      acc[method].amount += parseFloat(transaction.totalAmount.toString())
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    const paymentMethods = Object.entries(paymentMethodStats).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount,
      percentage: totalSales > 0 ? (stats.amount / totalSales) * 100 : 0,
    }))

    // Calculate top selling items
    const itemStats = transactions.reduce((acc, transaction) => {
      transaction.items.forEach((transactionItem) => {
        const itemId = transactionItem.item.id
        if (!acc[itemId]) {
          acc[itemId] = {
            item: transactionItem.item,
            quantity: 0,
            revenue: 0,
            transactions: new Set(),
          }
        }
        acc[itemId].quantity += transactionItem.quantity
        acc[itemId].revenue += parseFloat(transactionItem.totalAmount.toString())
        acc[itemId].transactions.add(transaction.id)
      })
      return acc
    }, {} as Record<string, any>)

    const topItems = Object.values(itemStats)
      .map((item: any) => ({
        item: item.item,
        quantity: item.quantity,
        revenue: item.revenue,
        transactions: item.transactions.size,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate hourly trends
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourTransactions = transactions.filter(t => {
        const transactionHour = new Date(t.createdAt).getHours()
        return transactionHour === hour
      })
      
      return {
        hour,
        sales: hourTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0),
        transactions: hourTransactions.length,
      }
    })

    // Get recent transactions with item count
    const recentTransactions = transactions.slice(0, 10).map(transaction => ({
      id: transaction.id,
      transactionNo: transaction.transactionNo,
      customer: transaction.customer || { name: 'Walk-in Customer' },
      totalAmount: parseFloat(transaction.totalAmount.toString()),
      paymentMethod: transaction.paymentMethod || 'UNKNOWN',
      createdAt: transaction.createdAt,
      itemCount: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
    }))

    // Additional analytics
    const analytics = {
      todaySales: {
        totalSales,
        totalTransactions,
        averageTransaction,
        totalItems,
      },
      paymentMethods: paymentMethods.sort((a, b) => b.amount - a.amount),
      topItems,
      hourlyTrends: hourlyStats,
      recentTransactions,
      date,
      summary: {
        peakHour: hourlyStats.reduce((max, current) => 
          current.sales > max.sales ? current : max, hourlyStats[0]
        ),
        mostPopularPayment: paymentMethods.length > 0 
          ? paymentMethods.reduce((max, current) => 
              current.count > max.count ? current : max
            )
          : null,
        topSellingItem: topItems.length > 0 ? topItems[0] : null,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching POS analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch POS analytics' },
      { status: 500 }
    )
  }
}

// Get POS performance metrics for a date range
export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, compareWith } = await request.json()
    
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get transactions for the main period
    const mainPeriodTransactions = await prisma.transaction.findMany({
      where: {
        type: 'SALE',
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    // Calculate main period metrics
    const mainMetrics = {
      totalSales: mainPeriodTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0),
      totalTransactions: mainPeriodTransactions.length,
      totalItems: mainPeriodTransactions.reduce((sum, t) => 
        sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
    }

    let comparison = null

    // If comparison period is requested
    if (compareWith) {
      const compareStart = new Date(compareWith.startDate)
      compareStart.setHours(0, 0, 0, 0)
      
      const compareEnd = new Date(compareWith.endDate)
      compareEnd.setHours(23, 59, 59, 999)

      const compareTransactions = await prisma.transaction.findMany({
        where: {
          type: 'SALE',
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: compareStart,
            lte: compareEnd,
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      const compareMetrics = {
        totalSales: compareTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0),
        totalTransactions: compareTransactions.length,
        totalItems: compareTransactions.reduce((sum, t) => 
          sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        ),
      }

      comparison = {
        period: compareWith,
        metrics: compareMetrics,
        changes: {
          salesChange: compareMetrics.totalSales > 0 
            ? ((mainMetrics.totalSales - compareMetrics.totalSales) / compareMetrics.totalSales) * 100
            : 0,
          transactionsChange: compareMetrics.totalTransactions > 0
            ? ((mainMetrics.totalTransactions - compareMetrics.totalTransactions) / compareMetrics.totalTransactions) * 100
            : 0,
          itemsChange: compareMetrics.totalItems > 0
            ? ((mainMetrics.totalItems - compareMetrics.totalItems) / compareMetrics.totalItems) * 100
            : 0,
        },
      }
    }

    // Daily breakdown for the main period
    const dailyBreakdown = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayTransactions = mainPeriodTransactions.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      )
      
      dailyBreakdown.push({
        date: currentDate.toISOString().split('T')[0],
        sales: dayTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0),
        transactions: dayTransactions.length,
        items: dayTransactions.reduce((sum, t) => 
          sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        ),
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const performanceReport = {
      period: { startDate, endDate },
      metrics: {
        ...mainMetrics,
        averageTransaction: mainMetrics.totalTransactions > 0 
          ? mainMetrics.totalSales / mainMetrics.totalTransactions 
          : 0,
        averageItemsPerTransaction: mainMetrics.totalTransactions > 0
          ? mainMetrics.totalItems / mainMetrics.totalTransactions
          : 0,
      },
      dailyBreakdown,
      comparison,
      generatedAt: new Date(),
    }

    return NextResponse.json(performanceReport)
  } catch (error) {
    console.error('Error generating POS performance report:', error)
    return NextResponse.json(
      { error: 'Failed to generate performance report' },
      { status: 500 }
    )
  }
}
