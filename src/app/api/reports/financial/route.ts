import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'profit-loss'
    const period = searchParams.get('period') || 'this-month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range based on period
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
        case 'yesterday':
          const yesterday = subDays(now, 1)
          dateFrom = startOfDay(yesterday)
          dateTo = endOfDay(yesterday)
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
        case 'this-quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          dateFrom = startOfDay(quarterStart)
          dateTo = endOfDay(now)
          break
        case 'this-year':
          dateFrom = startOfYear(now)
          dateTo = endOfYear(now)
          break
        case 'last-year':
          const lastYear = subYears(now, 1)
          dateFrom = startOfYear(lastYear)
          dateTo = endOfYear(lastYear)
          break
        default:
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
      }
    }

    switch (reportType) {
      case 'profit-loss':
        return await generateProfitLossReport(dateFrom, dateTo)
      case 'balance-sheet':
        return await generateBalanceSheetReport(dateTo)
      case 'cash-flow':
        return await generateCashFlowReport(dateFrom, dateTo)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating financial report:', error)
    return NextResponse.json(
      { error: 'Failed to generate financial report' },
      { status: 500 }
    )
  }
}

async function generateProfitLossReport(dateFrom: Date, dateTo: Date) {
  // Revenue (Sales)
  const salesData = await prisma.transaction.aggregate({
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
  })

  // Income transactions
  const incomeData = await prisma.transaction.aggregate({
    where: {
      type: 'INCOME',
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

  // Cost of Goods Sold (Purchases)
  const purchasesData = await prisma.transaction.aggregate({
    where: {
      type: 'PURCHASE',
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

  // Operating Expenses
  const expensesData = await prisma.transaction.aggregate({
    where: {
      type: 'EXPENSE',
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

  // Calculate totals
  const totalRevenue = (salesData._sum.totalAmount || 0) + (incomeData._sum.totalAmount || 0)
  const totalCOGS = purchasesData._sum.totalAmount || 0
  const totalExpenses = expensesData._sum.totalAmount || 0
  const grossProfit = totalRevenue - totalCOGS
  const netProfit = grossProfit - totalExpenses

  // Get detailed breakdown by category for expenses
  const expensesByCategory = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      type: 'EXPENSE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      category: {
        not: null,
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
    revenue: {
      sales: {
        amount: salesData._sum.totalAmount || 0,
        count: salesData._count,
        tax: salesData._sum.taxAmount || 0,
        discount: salesData._sum.discountAmount || 0,
      },
      otherIncome: {
        amount: incomeData._sum.totalAmount || 0,
        count: incomeData._count,
      },
      total: totalRevenue,
    },
    costOfGoodsSold: {
      purchases: {
        amount: purchasesData._sum.totalAmount || 0,
        count: purchasesData._count,
      },
      total: totalCOGS,
    },
    grossProfit: {
      amount: grossProfit,
      margin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    },
    operatingExpenses: {
      total: totalExpenses,
      count: expensesData._count,
      byCategory: expensesByCategory.map(expense => ({
        category: expense.category || 'Uncategorized',
        amount: expense._sum.totalAmount || 0,
        count: expense._count,
      })),
    },
    netProfit: {
      amount: netProfit,
      margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    },
    summary: {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    },
  }

  return NextResponse.json(report)
}

async function generateBalanceSheetReport(asOfDate: Date) {
  // Assets - Current Assets (Inventory)
  const inventoryValue = await prisma.item.aggregate({
    where: {
      isActive: true,
      stockQuantity: {
        gt: 0,
      },
    },
    _sum: {
      stockQuantity: true,
    },
  })

  // Calculate inventory value (using cost price where available, otherwise unit price)
  const inventoryItems = await prisma.item.findMany({
    where: {
      isActive: true,
      stockQuantity: {
        gt: 0,
      },
    },
    select: {
      stockQuantity: true,
      costPrice: true,
      unitPrice: true,
    },
  })

  const totalInventoryValue = inventoryItems.reduce((total, item) => {
    const price = item.costPrice || item.unitPrice
    return total + (item.stockQuantity * Number(price))
  }, 0)

  // Accounts Receivable (Outstanding Invoices)
  const accountsReceivable = await prisma.invoice.aggregate({
    where: {
      status: {
        in: ['SENT', 'OVERDUE'],
      },
      dueDate: {
        lte: asOfDate,
      },
    },
    _sum: {
      balanceAmount: true,
    },
    _count: true,
  })

  // Accounts Payable (Outstanding Purchase Transactions)
  const accountsPayable = await prisma.transaction.aggregate({
    where: {
      type: 'PURCHASE',
      paymentStatus: 'PENDING',
      date: {
        lte: asOfDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  })

  const report = {
    asOfDate,
    assets: {
      currentAssets: {
        inventory: {
          value: totalInventoryValue,
          quantity: inventoryValue._sum.stockQuantity || 0,
        },
        accountsReceivable: {
          amount: accountsReceivable._sum.balanceAmount || 0,
          count: accountsReceivable._count,
        },
        total: totalInventoryValue + (accountsReceivable._sum.balanceAmount || 0),
      },
      totalAssets: totalInventoryValue + (accountsReceivable._sum.balanceAmount || 0),
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: {
          amount: accountsPayable._sum.totalAmount || 0,
          count: accountsPayable._count,
        },
        total: accountsPayable._sum.totalAmount || 0,
      },
      totalLiabilities: accountsPayable._sum.totalAmount || 0,
    },
    equity: {
      retainedEarnings: (totalInventoryValue + (accountsReceivable._sum.balanceAmount || 0)) - (accountsPayable._sum.totalAmount || 0),
      totalEquity: (totalInventoryValue + (accountsReceivable._sum.balanceAmount || 0)) - (accountsPayable._sum.totalAmount || 0),
    },
  }

  return NextResponse.json(report)
}

async function generateCashFlowReport(dateFrom: Date, dateTo: Date) {
  // Operating Activities - Cash from Sales
  const cashFromSales = await prisma.payment.aggregate({
    where: {
      paymentDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: 'COMPLETED',
      invoice: {
        isNot: null,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  // Operating Activities - Cash from Other Income
  const cashFromIncome = await prisma.transaction.aggregate({
    where: {
      type: 'INCOME',
      paymentStatus: 'COMPLETED',
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

  // Operating Activities - Cash for Purchases
  const cashForPurchases = await prisma.transaction.aggregate({
    where: {
      type: 'PURCHASE',
      paymentStatus: 'COMPLETED',
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

  // Operating Activities - Cash for Expenses
  const cashForExpenses = await prisma.transaction.aggregate({
    where: {
      type: 'EXPENSE',
      paymentStatus: 'COMPLETED',
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

  const operatingCashFlow = 
    (cashFromSales._sum.amount || 0) + 
    (cashFromIncome._sum.totalAmount || 0) - 
    (cashForPurchases._sum.totalAmount || 0) - 
    (cashForExpenses._sum.totalAmount || 0)

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    operatingActivities: {
      cashInflows: {
        salesReceipts: {
          amount: cashFromSales._sum.amount || 0,
          count: cashFromSales._count,
        },
        otherIncome: {
          amount: cashFromIncome._sum.totalAmount || 0,
          count: cashFromIncome._count,
        },
        total: (cashFromSales._sum.amount || 0) + (cashFromIncome._sum.totalAmount || 0),
      },
      cashOutflows: {
        purchases: {
          amount: cashForPurchases._sum.totalAmount || 0,
          count: cashForPurchases._count,
        },
        expenses: {
          amount: cashForExpenses._sum.totalAmount || 0,
          count: cashForExpenses._count,
        },
        total: (cashForPurchases._sum.totalAmount || 0) + (cashForExpenses._sum.totalAmount || 0),
      },
      netOperatingCashFlow: operatingCashFlow,
    },
    summary: {
      netCashFlow: operatingCashFlow,
      cashFlowFromOperations: operatingCashFlow,
    },
  }

  return NextResponse.json(report)
}
