import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, differenceInDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const partyType = searchParams.get('partyType') || 'CUSTOMER'
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
        case 'this-month':
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
          break
        case 'last-month':
          const lastMonth = subMonths(now, 1)
          dateFrom = startOfMonth(lastMonth)
          dateTo = endOfMonth(lastMonth)
          break
        case 'this-year':
          dateFrom = new Date(now.getFullYear(), 0, 1)
          dateTo = new Date(now.getFullYear(), 11, 31)
          break
        default:
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
      }
    }

    switch (reportType) {
      case 'overview':
        return await generatePartiesOverviewReport(partyType as any, dateFrom, dateTo)
      case 'aging':
        return await generateAgingReport(partyType as any, dateTo)
      case 'performance':
        return await generatePartyPerformanceReport(partyType as any, dateFrom, dateTo)
      case 'credit-analysis':
        return await generateCreditAnalysisReport(partyType as any, dateTo)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating parties report:', error)
    return NextResponse.json(
      { error: 'Failed to generate parties report' },
      { status: 500 }
    )
  }
}

async function generatePartiesOverviewReport(partyType: 'CUSTOMER' | 'SUPPLIER', dateFrom: Date, dateTo: Date) {
  // Total parties count
  const totalParties = await prisma.party.count({
    where: {
      type: partyType,
      isActive: true,
    },
  })

  // New parties in period
  const newParties = await prisma.party.count({
    where: {
      type: partyType,
      isActive: true,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  })

  // Transaction type based on party type
  const transactionType = partyType === 'CUSTOMER' ? 'SALE' : 'PURCHASE'
  const relationField = partyType === 'CUSTOMER' ? 'customerId' : 'supplierId'

  // Parties with transactions in period
  const partiesWithTransactions = await prisma.transaction.groupBy({
    by: [relationField],
    where: {
      type: transactionType,
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      [relationField]: {
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
  })

  // Top parties by transaction value
  const topPartiesByValue = partiesWithTransactions
    .sort((a, b) => (b._sum.totalAmount || 0) - (a._sum.totalAmount || 0))
    .slice(0, 10)

  // Get party details for top parties
  const topPartyIds = topPartiesByValue.map(p => p[relationField]).filter(Boolean) as string[]
  const topPartiesDetails = await prisma.party.findMany({
    where: {
      id: {
        in: topPartyIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      creditLimit: true,
      paymentTerms: true,
    },
  })

  // Outstanding amounts (for customers: unpaid invoices, for suppliers: unpaid purchases)
  let outstandingData
  if (partyType === 'CUSTOMER') {
    outstandingData = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        status: {
          in: ['SENT', 'OVERDUE'],
        },
      },
      _sum: {
        balanceAmount: true,
      },
      _count: true,
    })
  } else {
    outstandingData = await prisma.transaction.groupBy({
      by: ['supplierId'],
      where: {
        type: 'PURCHASE',
        paymentStatus: 'PENDING',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })
  }

  // Payment behavior analysis
  const paymentAnalysis = await prisma.payment.groupBy({
    by: [partyType === 'CUSTOMER' ? 'invoiceId' : 'transactionId'],
    where: {
      paymentDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: 'COMPLETED',
      ...(partyType === 'CUSTOMER' ? { invoiceId: { not: null } } : { transactionId: { not: null } }),
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    partyType,
    overview: {
      totalParties,
      newParties,
      activeParties: partiesWithTransactions.length,
      totalTransactionValue: partiesWithTransactions.reduce((sum, p) => sum + (p._sum.totalAmount || 0), 0),
      averageTransactionValue: partiesWithTransactions.length > 0 
        ? partiesWithTransactions.reduce((sum, p) => sum + (p._avg.totalAmount || 0), 0) / partiesWithTransactions.length 
        : 0,
      totalTransactions: partiesWithTransactions.reduce((sum, p) => sum + p._count, 0),
    },
    topParties: topPartiesByValue.map(party => {
      const partyDetails = topPartiesDetails.find(p => p.id === party[relationField])
      const outstanding = outstandingData?.find(o => o[relationField === 'customerId' ? 'customerId' : 'supplierId'] === party[relationField])
      
      return {
        partyId: party[relationField],
        partyName: partyDetails?.name || 'Unknown',
        email: partyDetails?.email,
        phone: partyDetails?.phone,
        city: partyDetails?.city,
        creditLimit: partyDetails?.creditLimit ? Number(partyDetails.creditLimit) : null,
        paymentTerms: partyDetails?.paymentTerms,
        transactionValue: party._sum.totalAmount || 0,
        transactionCount: party._count,
        averageTransactionValue: party._avg.totalAmount || 0,
        outstandingAmount: outstanding?._sum.totalAmount || outstanding?._sum.balanceAmount || 0,
        outstandingCount: outstanding?._count || 0,
      }
    }),
    summary: {
      totalOutstanding: outstandingData?.reduce((sum, o) => sum + (o._sum.totalAmount || o._sum.balanceAmount || 0), 0) || 0,
      totalOutstandingCount: outstandingData?.reduce((sum, o) => sum + o._count, 0) || 0,
      paymentsMade: paymentAnalysis.reduce((sum, p) => sum + (p._sum.amount || 0), 0),
      paymentsCount: paymentAnalysis.reduce((sum, p) => sum + p._count, 0),
    },
  }

  return NextResponse.json(report)
}

async function generateAgingReport(partyType: 'CUSTOMER' | 'SUPPLIER', asOfDate: Date) {
  let agingData: any[]

  if (partyType === 'CUSTOMER') {
    // Customer aging based on invoice due dates
    agingData = await prisma.$queryRaw`
      SELECT
        i."customerId" as party_id,
        p.name as party_name,
        p.email,
        p.phone,
        p."creditLimit",
        SUM(CASE WHEN i."dueDate" >= ${asOfDate} THEN i."balanceAmount" ELSE 0 END)::decimal as current_amount,
        SUM(CASE WHEN i."dueDate" < ${asOfDate} AND i."dueDate" >= ${subDays(asOfDate, 30)} THEN i."balanceAmount" ELSE 0 END)::decimal as days_1_30,
        SUM(CASE WHEN i."dueDate" < ${subDays(asOfDate, 30)} AND i."dueDate" >= ${subDays(asOfDate, 60)} THEN i."balanceAmount" ELSE 0 END)::decimal as days_31_60,
        SUM(CASE WHEN i."dueDate" < ${subDays(asOfDate, 60)} AND i."dueDate" >= ${subDays(asOfDate, 90)} THEN i."balanceAmount" ELSE 0 END)::decimal as days_61_90,
        SUM(CASE WHEN i."dueDate" < ${subDays(asOfDate, 90)} THEN i."balanceAmount" ELSE 0 END)::decimal as days_over_90,
        SUM(i."balanceAmount")::decimal as total_outstanding,
        COUNT(i.id)::int as invoice_count
      FROM invoices i
      JOIN parties p ON i."customerId" = p.id
      WHERE i.status IN ('SENT', 'OVERDUE')
        AND i."balanceAmount" > 0
        AND p."type" = 'CUSTOMER'
      GROUP BY i."customerId", p.name, p.email, p.phone, p."creditLimit"
      HAVING SUM(i."balanceAmount") > 0
      ORDER BY total_outstanding DESC
    ` as Array<{
      party_id: string
      party_name: string
      email: string | null
      phone: string | null
      credit_limit: number | null
      current_amount: number
      days_1_30: number
      days_31_60: number
      days_61_90: number
      days_over_90: number
      total_outstanding: number
      invoice_count: number
    }>
  } else {
    // Supplier aging based on purchase transaction dates
    agingData = await prisma.$queryRaw`
      SELECT
        t."supplierId" as party_id,
        p.name as party_name,
        p.email,
        p.phone,
        p."creditLimit",
        SUM(CASE WHEN t."date" >= ${subDays(asOfDate, 30)} THEN t."totalAmount" ELSE 0 END)::decimal as current_amount,
        SUM(CASE WHEN t."date" < ${subDays(asOfDate, 30)} AND t."date" >= ${subDays(asOfDate, 60)} THEN t."totalAmount" ELSE 0 END)::decimal as days_1_30,
        SUM(CASE WHEN t."date" < ${subDays(asOfDate, 60)} AND t."date" >= ${subDays(asOfDate, 90)} THEN t."totalAmount" ELSE 0 END)::decimal as days_31_60,
        SUM(CASE WHEN t."date" < ${subDays(asOfDate, 90)} AND t."date" >= ${subDays(asOfDate, 120)} THEN t."totalAmount" ELSE 0 END)::decimal as days_61_90,
        SUM(CASE WHEN t."date" < ${subDays(asOfDate, 120)} THEN t."totalAmount" ELSE 0 END)::decimal as days_over_90,
        SUM(t."totalAmount")::decimal as total_outstanding,
        COUNT(t.id)::int as transaction_count
      FROM transactions t
      JOIN parties p ON t."supplierId" = p.id
      WHERE t."type" = 'PURCHASE'
        AND t."paymentStatus" = 'PENDING'
        AND p."type" = 'SUPPLIER'
      GROUP BY t."supplierId", p.name, p.email, p.phone, p."creditLimit"
      HAVING SUM(t."totalAmount") > 0
      ORDER BY total_outstanding DESC
    ` as Array<{
      party_id: string
      party_name: string
      email: string | null
      phone: string | null
      credit_limit: number | null
      current_amount: number
      days_1_30: number
      days_31_60: number
      days_61_90: number
      days_over_90: number
      total_outstanding: number
      transaction_count: number
    }>
  }

  // Calculate totals
  const totals = agingData.reduce((acc, party) => ({
    current: acc.current + Number(party.current_amount),
    days1_30: acc.days1_30 + Number(party.days_1_30),
    days31_60: acc.days31_60 + Number(party.days_31_60),
    days61_90: acc.days61_90 + Number(party.days_61_90),
    daysOver90: acc.daysOver90 + Number(party.days_over_90),
    total: acc.total + Number(party.total_outstanding),
  }), {
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    daysOver90: 0,
    total: 0,
  })

  const report = {
    asOfDate,
    partyType,
    summary: {
      totalParties: agingData.length,
      totalOutstanding: totals.total,
      breakdown: {
        current: totals.current,
        days1_30: totals.days1_30,
        days31_60: totals.days31_60,
        days61_90: totals.days61_90,
        daysOver90: totals.daysOver90,
      },
      percentages: {
        current: totals.total > 0 ? (totals.current / totals.total) * 100 : 0,
        days1_30: totals.total > 0 ? (totals.days1_30 / totals.total) * 100 : 0,
        days31_60: totals.total > 0 ? (totals.days31_60 / totals.total) * 100 : 0,
        days61_90: totals.total > 0 ? (totals.days61_90 / totals.total) * 100 : 0,
        daysOver90: totals.total > 0 ? (totals.daysOver90 / totals.total) * 100 : 0,
      },
    },
    agingDetails: agingData.map(party => ({
      partyId: party.party_id,
      partyName: party.party_name,
      email: party.email,
      phone: party.phone,
      creditLimit: party.credit_limit ? Number(party.credit_limit) : null,
      aging: {
        current: Number(party.current_amount),
        days1_30: Number(party.days_1_30),
        days31_60: Number(party.days_31_60),
        days61_90: Number(party.days_61_90),
        daysOver90: Number(party.days_over_90),
        total: Number(party.total_outstanding),
      },
      transactionCount: party.transaction_count || party.invoice_count,
      riskLevel: Number(party.days_over_90) > 0 ? 'HIGH' : 
                Number(party.days_61_90) > 0 ? 'MEDIUM' : 
                Number(party.days_31_60) > 0 ? 'LOW' : 'CURRENT',
    })),
  }

  return NextResponse.json(report)
}

async function generatePartyPerformanceReport(partyType: 'CUSTOMER' | 'SUPPLIER', dateFrom: Date, dateTo: Date) {
  const transactionType = partyType === 'CUSTOMER' ? 'SALE' : 'PURCHASE'
  const relationField = partyType === 'CUSTOMER' ? 'customerId' : 'supplierId'

  // Monthly performance
  const monthlyPerformance = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', t."date") as month,
      COUNT(DISTINCT t."${relationField}")::int as active_parties,
      COUNT(t.id)::int as transaction_count,
      SUM(t."totalAmount")::decimal as total_amount,
      AVG(t."totalAmount")::decimal as avg_transaction_value
    FROM transactions t
    WHERE t."type" = ${transactionType}
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND t."${relationField}" IS NOT NULL
    GROUP BY DATE_TRUNC('month', t."date")
    ORDER BY month
  ` as Array<{
    month: Date
    active_parties: number
    transaction_count: number
    total_amount: number
    avg_transaction_value: number
  }>

  // Party loyalty analysis (repeat business)
  const loyaltyAnalysis = await prisma.$queryRaw`
    SELECT
      t."${relationField}" as party_id,
      p.name as party_name,
      COUNT(t.id)::int as transaction_count,
      SUM(t."totalAmount")::decimal as total_amount,
      MIN(t."date") as first_transaction,
      MAX(t."date") as last_transaction,
      AVG(t."totalAmount")::decimal as avg_transaction_value
    FROM transactions t
    JOIN parties p ON t."${relationField}" = p.id
    WHERE t."type" = ${transactionType}
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND t."${relationField}" IS NOT NULL
    GROUP BY t."${relationField}", p.name
    HAVING COUNT(t.id) > 1
    ORDER BY transaction_count DESC, total_amount DESC
    LIMIT 20
  ` as Array<{
    party_id: string
    party_name: string
    transaction_count: number
    total_amount: number
    first_transaction: Date
    last_transaction: Date
    avg_transaction_value: number
  }>

  // Payment behavior (for customers)
  let paymentBehavior: any[] = []
  if (partyType === 'CUSTOMER') {
    paymentBehavior = await prisma.$queryRaw`
      SELECT
        i."customerId" as party_id,
        p.name as party_name,
        COUNT(i.id)::int as total_invoices,
        COUNT(CASE WHEN i.status = 'PAID' THEN 1 END)::int as paid_invoices,
        COUNT(CASE WHEN i.status = 'OVERDUE' THEN 1 END)::int as overdue_invoices,
        AVG(CASE WHEN i.status = 'PAID' THEN EXTRACT(DAYS FROM (i."updatedAt" - i."dueDate")) END)::decimal as avg_days_to_pay,
        SUM(i."balanceAmount")::decimal as outstanding_amount
      FROM invoices i
      JOIN parties p ON i."customerId" = p.id
      WHERE i."issueDate" >= ${dateFrom}
        AND i."issueDate" <= ${dateTo}
        AND i.status != 'CANCELLED'
      GROUP BY i."customerId", p.name
      ORDER BY total_invoices DESC
      LIMIT 20
    ` as Array<{
      party_id: string
      party_name: string
      total_invoices: number
      paid_invoices: number
      overdue_invoices: number
      avg_days_to_pay: number | null
      outstanding_amount: number
    }>
  }

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    partyType,
    monthlyTrends: monthlyPerformance.map(month => ({
      month: month.month,
      activeParties: month.active_parties,
      transactionCount: month.transaction_count,
      totalAmount: Number(month.total_amount),
      avgTransactionValue: Number(month.avg_transaction_value),
    })),
    loyaltyAnalysis: loyaltyAnalysis.map(party => ({
      partyId: party.party_id,
      partyName: party.party_name,
      transactionCount: party.transaction_count,
      totalAmount: Number(party.total_amount),
      avgTransactionValue: Number(party.avg_transaction_value),
      firstTransaction: party.first_transaction,
      lastTransaction: party.last_transaction,
      relationshipDays: differenceInDays(party.last_transaction, party.first_transaction),
      loyaltyScore: party.transaction_count * 10 + (Number(party.total_amount) / 1000), // Simple scoring
    })),
    ...(partyType === 'CUSTOMER' && {
      paymentBehavior: paymentBehavior.map(customer => ({
        partyId: customer.party_id,
        partyName: customer.party_name,
        totalInvoices: customer.total_invoices,
        paidInvoices: customer.paid_invoices,
        overdueInvoices: customer.overdue_invoices,
        paymentRate: customer.total_invoices > 0 ? (customer.paid_invoices / customer.total_invoices) * 100 : 0,
        avgDaysToPay: customer.avg_days_to_pay ? Number(customer.avg_days_to_pay) : null,
        outstandingAmount: Number(customer.outstanding_amount),
        paymentRisk: customer.overdue_invoices > customer.paid_invoices ? 'HIGH' : 
                    customer.overdue_invoices > 0 ? 'MEDIUM' : 'LOW',
      })),
    }),
  }

  return NextResponse.json(report)
}

async function generateCreditAnalysisReport(partyType: 'CUSTOMER' | 'SUPPLIER', asOfDate: Date) {
  // Only applicable for customers typically
  if (partyType !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Credit analysis is only available for customers' }, { status: 400 })
  }

  // Customers with credit limits
  const customersWithCredit = await prisma.party.findMany({
    where: {
      type: 'CUSTOMER',
      isActive: true,
      creditLimit: {
        not: null,
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      creditLimit: true,
      paymentTerms: true,
    },
  })

  // Calculate credit utilization for each customer
  const creditAnalysis = await Promise.all(
    customersWithCredit.map(async (customer) => {
      // Outstanding invoices
      const outstanding = await prisma.invoice.aggregate({
        where: {
          customerId: customer.id,
          status: {
            in: ['SENT', 'OVERDUE'],
          },
        },
        _sum: {
          balanceAmount: true,
        },
        _count: true,
      })

      // Recent payment history (last 6 months)
      const recentPayments = await prisma.payment.aggregate({
        where: {
          invoice: {
            customerId: customer.id,
          },
          paymentDate: {
            gte: subMonths(asOfDate, 6),
            lte: asOfDate,
          },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      })

      // Overdue invoices
      const overdueInvoices = await prisma.invoice.aggregate({
        where: {
          customerId: customer.id,
          status: 'OVERDUE',
        },
        _sum: {
          balanceAmount: true,
        },
        _count: true,
      })

      const creditLimit = Number(customer.creditLimit || 0)
      const outstandingAmount = Number(outstanding._sum.balanceAmount || 0)
      const creditUtilization = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0
      const availableCredit = Math.max(0, creditLimit - outstandingAmount)

      return {
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit,
        paymentTerms: customer.paymentTerms,
        outstandingAmount,
        creditUtilization,
        availableCredit,
        outstandingInvoices: outstanding._count,
        overdueAmount: Number(overdueInvoices._sum.balanceAmount || 0),
        overdueInvoices: overdueInvoices._count,
        recentPayments: Number(recentPayments._sum.amount || 0),
        recentPaymentCount: recentPayments._count,
        creditRisk: creditUtilization > 90 ? 'HIGH' : 
                   creditUtilization > 70 ? 'MEDIUM' : 
                   creditUtilization > 50 ? 'LOW' : 'MINIMAL',
        recommendedAction: creditUtilization > 90 ? 'SUSPEND_CREDIT' :
                          creditUtilization > 70 ? 'MONITOR_CLOSELY' :
                          overdueInvoices._count > 0 ? 'FOLLOW_UP_PAYMENT' : 'NORMAL',
      }
    })
  )

  // Sort by credit utilization descending
  creditAnalysis.sort((a, b) => b.creditUtilization - a.creditUtilization)

  // Summary statistics
  const totalCreditLimit = creditAnalysis.reduce((sum, c) => sum + c.creditLimit, 0)
  const totalOutstanding = creditAnalysis.reduce((sum, c) => sum + c.outstandingAmount, 0)
  const totalOverdue = creditAnalysis.reduce((sum, c) => sum + c.overdueAmount, 0)
  const highRiskCustomers = creditAnalysis.filter(c => c.creditRisk === 'HIGH').length
  const mediumRiskCustomers = creditAnalysis.filter(c => c.creditRisk === 'MEDIUM').length

  const report = {
    asOfDate,
    summary: {
      totalCustomersWithCredit: customersWithCredit.length,
      totalCreditLimit,
      totalOutstanding,
      totalOverdue,
      overallCreditUtilization: totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0,
      totalAvailableCredit: totalCreditLimit - totalOutstanding,
      riskDistribution: {
        high: highRiskCustomers,
        medium: mediumRiskCustomers,
        low: creditAnalysis.filter(c => c.creditRisk === 'LOW').length,
        minimal: creditAnalysis.filter(c => c.creditRisk === 'MINIMAL').length,
      },
    },
    creditAnalysis: creditAnalysis.slice(0, 50), // Top 50 by utilization
    highRiskCustomers: creditAnalysis.filter(c => c.creditRisk === 'HIGH'),
    customersNeedingAttention: creditAnalysis.filter(c => 
      c.recommendedAction === 'SUSPEND_CREDIT' || 
      c.recommendedAction === 'MONITOR_CLOSELY' || 
      c.recommendedAction === 'FOLLOW_UP_PAYMENT'
    ),
  }

  return NextResponse.json(report)
}
