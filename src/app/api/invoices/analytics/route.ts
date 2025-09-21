import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const customerId = searchParams.get('customerId')
    
    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const where: any = {
      createdAt: {
        gte: startDate,
      },
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Get invoice statistics
    const [
      totalInvoices,
      invoicesByStatus,
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      overdueInvoices,
      averageInvoiceValue,
      paymentStats,
      monthlyTrends,
      topCustomers,
    ] = await Promise.all([
      // Total invoices count
      prisma.invoice.count({ where }),

      // Invoices by status
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
        _sum: {
          totalAmount: true,
          balanceAmount: true,
        },
      }),

      // Total revenue (all invoices)
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
      }),

      // Paid revenue
      prisma.invoice.aggregate({
        where: {
          ...where,
          status: 'PAID',
        },
        _sum: {
          paidAmount: true,
        },
      }),

      // Outstanding revenue
      prisma.invoice.aggregate({
        where: {
          ...where,
          status: {
            in: ['SENT', 'OVERDUE'],
          },
        },
        _sum: {
          balanceAmount: true,
        },
      }),

      // Overdue invoices
      prisma.invoice.findMany({
        where: {
          ...where,
          status: 'OVERDUE',
          dueDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          invoiceNo: true,
          customer: {
            select: {
              name: true,
            },
          },
          dueDate: true,
          balanceAmount: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 10,
      }),

      // Average invoice value
      prisma.invoice.aggregate({
        where,
        _avg: {
          totalAmount: true,
        },
      }),

      // Payment statistics
      prisma.payment.aggregate({
        where: {
          invoice: where,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        _avg: {
          amount: true,
        },
      }),

      // Monthly trends (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "issueDate") as month,
          COUNT(*) as invoice_count,
          SUM("totalAmount") as total_revenue,
          SUM(CASE WHEN status = 'PAID' THEN "paidAmount" ELSE 0 END) as paid_revenue,
          SUM(CASE WHEN status IN ('SENT', 'OVERDUE') THEN "balanceAmount" ELSE 0 END) as outstanding_revenue
        FROM "invoices"
        WHERE "issueDate" >= NOW() - INTERVAL '12 months'
        ${customerId ? `AND "customerId" = '${customerId}'` : ''}
        GROUP BY DATE_TRUNC('month', "issueDate")
        ORDER BY month DESC
        LIMIT 12
      `,

      // Top customers by invoice value
      prisma.invoice.groupBy({
        by: ['customerId'],
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Get customer details for top customers
    const customerIds = topCustomers.map(c => c.customerId)
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
      },
    })

    // Combine customer data with statistics
    const topCustomersWithDetails = topCustomers.map(stat => {
      const customer = customers.find(c => c.id === stat.customerId)
      return {
        customer,
        totalInvoices: stat._count.id,
        totalRevenue: stat._sum.totalAmount || 0,
        paidRevenue: stat._sum.paidAmount || 0,
        outstandingRevenue: (stat._sum.totalAmount || 0) - (stat._sum.paidAmount || 0),
      }
    })

    // Calculate aging report
    const today = new Date()
    const agingRanges = [
      { label: 'Current', min: 0, max: 0 },
      { label: '1-30 days', min: 1, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
      { label: '90+ days', min: 91, max: 999999 },
    ]

    const agingReport = await Promise.all(
      agingRanges.map(async (range) => {
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - range.max)
        
        const endDate = range.min === 0 ? today : new Date(today)
        endDate.setDate(endDate.getDate() - range.min)

        const result = await prisma.invoice.aggregate({
          where: {
            status: {
              in: ['SENT', 'OVERDUE'],
            },
            dueDate: range.min === 0 
              ? { gte: endDate }
              : range.max === 999999
                ? { lt: startDate }
                : { gte: startDate, lt: endDate },
            ...(customerId && { customerId }),
          },
          _sum: {
            balanceAmount: true,
          },
          _count: {
            id: true,
          },
        })

        return {
          range: range.label,
          count: result._count.id,
          amount: result._sum.balanceAmount || 0,
        }
      })
    )

    // Calculate collection efficiency
    const collectionEfficiency = totalRevenue._sum.totalAmount 
      ? ((paidRevenue._sum.paidAmount || 0) / totalRevenue._sum.totalAmount) * 100
      : 0

    // Calculate average days to payment
    const paidInvoicesWithDays = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(DAY FROM (p."paymentDate" - i."issueDate"))) as avg_days_to_payment
      FROM "invoices" i
      JOIN "payments" p ON i.id = p."invoiceId"
      WHERE i."issueDate" >= ${startDate}
      AND p.status = 'COMPLETED'
      ${customerId ? `AND i."customerId" = '${customerId}'` : ''}
    ` as any[]

    const avgDaysToPayment = paidInvoicesWithDays[0]?.avg_days_to_payment || 0

    const analytics = {
      summary: {
        totalInvoices,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        paidRevenue: paidRevenue._sum.paidAmount || 0,
        outstandingRevenue: outstandingRevenue._sum.balanceAmount || 0,
        averageInvoiceValue: averageInvoiceValue._avg.totalAmount || 0,
        collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
        avgDaysToPayment: Math.round(avgDaysToPayment * 10) / 10,
      },
      statusBreakdown: invoicesByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
        totalAmount: status._sum.totalAmount || 0,
        outstandingAmount: status._sum.balanceAmount || 0,
      })),
      paymentStats: {
        totalPayments: paymentStats._count.id,
        totalPaid: paymentStats._sum.amount || 0,
        averagePayment: paymentStats._avg.amount || 0,
      },
      overdueInvoices: overdueInvoices.map(invoice => ({
        ...invoice,
        daysOverdue: Math.ceil((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      monthlyTrends,
      topCustomers: topCustomersWithDetails,
      agingReport,
      period: {
        days: periodDays,
        startDate,
        endDate: new Date(),
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching invoice analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice analytics' },
      { status: 500 }
    )
  }
}
