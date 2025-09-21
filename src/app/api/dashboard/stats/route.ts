import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total revenue from completed transactions
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
    })

    // Get active customers count
    const activeCustomers = await prisma.party.count({
      where: {
        type: 'CUSTOMER',
        isActive: true,
      },
    })

    // Get sales count for current month
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const salesThisMonth = await prisma.transaction.count({
      where: {
        type: 'SALE',
        date: {
          gte: currentMonth,
        },
      },
    })

    // Get pending invoices count
    const pendingInvoices = await prisma.invoice.count({
      where: {
        status: {
          in: ['DRAFT', 'SENT'],
        },
      },
    })

    const stats = [
      {
        title: 'Total Revenue',
        value: `$${(totalRevenue._sum.totalAmount || 0).toFixed(2)}`,
        change: '+20.1%', // This would be calculated based on previous period
        changeType: 'positive',
        icon: 'DollarSign',
      },
      {
        title: 'Active Customers',
        value: activeCustomers.toString(),
        change: '+180.1%',
        changeType: 'positive',
        icon: 'Users',
      },
      {
        title: 'Sales This Month',
        value: salesThisMonth.toString(),
        change: '+19%',
        changeType: 'positive',
        icon: 'ShoppingCart',
      },
      {
        title: 'Pending Invoices',
        value: pendingInvoices.toString(),
        change: '-4.3%',
        changeType: 'negative',
        icon: 'FileText',
      },
    ]

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
