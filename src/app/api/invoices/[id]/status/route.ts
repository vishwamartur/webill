import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@/generated/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, paymentAmount, paymentMethod, paymentReference } = await request.json()
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current invoice
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!currentInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let updateData: any = {
        status,
        updatedAt: new Date(),
      }

      // Handle status-specific updates
      switch (status) {
        case 'SENT':
          if (currentInvoice.status === 'DRAFT') {
            updateData.sentDate = new Date()
          }
          break

        case 'PAID':
          // If marking as paid, update payment amounts
          const totalAmount = currentInvoice.totalAmount
          updateData.paidAmount = totalAmount
          updateData.balanceAmount = 0
          
          // Create payment record if payment details provided
          if (paymentAmount && paymentMethod) {
            await tx.payment.create({
              data: {
                paymentNo: `PAY-${Date.now()}`,
                invoiceId: params.id,
                amount: parseFloat(paymentAmount.toString()),
                paymentDate: new Date(),
                paymentMethod,
                status: 'COMPLETED',
                reference: paymentReference,
                notes: `Payment for invoice ${currentInvoice.invoiceNo}`,
              },
            })
          }
          break

        case 'OVERDUE':
          // Automatically set to overdue if past due date
          if (new Date() > new Date(currentInvoice.dueDate)) {
            updateData.status = 'OVERDUE'
          }
          break

        case 'CANCELLED':
          // Reset payment amounts if cancelled
          updateData.paidAmount = 0
          updateData.balanceAmount = currentInvoice.totalAmount
          break
      }

      // Update the invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: params.id },
        data: updateData,
      })

      return updatedInvoice
    })

    // Fetch the complete updated invoice
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        transaction: true,
        items: {
          include: {
            item: true,
          },
        },
        payments: true,
      },
    })

    return NextResponse.json(completeInvoice)
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    )
  }
}

// Get invoice status history and analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Calculate status analytics
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    const daysPastDue = invoice.status !== 'PAID' && today > dueDate 
      ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const daysUntilDue = invoice.status !== 'PAID' && today < dueDate
      ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const statusAnalytics = {
      currentStatus: invoice.status,
      daysPastDue,
      daysUntilDue,
      isOverdue: daysPastDue > 0,
      totalPaid: invoice.paidAmount,
      balanceRemaining: invoice.balanceAmount,
      paymentProgress: invoice.totalAmount > 0 ? (invoice.paidAmount / invoice.totalAmount) * 100 : 0,
      remindersSent: invoice.remindersSent,
      lastReminderDate: invoice.lastReminderDate,
    }

    return NextResponse.json({
      invoice,
      analytics: statusAnalytics,
      paymentHistory: invoice.payments,
    })
  } catch (error) {
    console.error('Error fetching invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice status' },
      { status: 500 }
    )
  }
}
