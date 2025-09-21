import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        date: 'desc',
      },
      include: {
        customer: true,
        supplier: true,
      },
    })

    const formattedTransactions = recentTransactions.map((transaction) => ({
      id: transaction.id,
      customer: transaction.customer?.name || transaction.supplier?.name || 'Unknown',
      amount: `$${transaction.totalAmount.toFixed(2)}`,
      status: transaction.paymentStatus === 'COMPLETED' ? 'Paid' : 
              transaction.paymentStatus === 'PENDING' ? 'Pending' : 'Failed',
      date: transaction.date.toISOString().split('T')[0],
      type: transaction.type,
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error('Error fetching recent transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent transactions' },
      { status: 500 }
    )
  }
}
