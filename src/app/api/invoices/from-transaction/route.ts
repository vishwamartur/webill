import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Fetch the transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.type !== 'SALE') {
      return NextResponse.json(
        { error: 'Only sales transactions can be converted to invoices' },
        { status: 400 }
      )
    }

    if (!transaction.customer) {
      return NextResponse.json(
        { error: 'Transaction must have a customer to create an invoice' },
        { status: 400 }
      )
    }

    // Check if invoice already exists for this transaction
    const existingInvoice = await prisma.invoice.findFirst({
      where: { transactionId: transactionId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this transaction', invoiceId: existingInvoice.id },
        { status: 409 }
      )
    }

    // Generate invoice number
    const invoiceNo = generateInvoiceNumber()
    
    // Calculate due date (default to 30 days)
    const issueDate = new Date()
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: transaction.customerId!,
          transactionId: transaction.id,
          issueDate,
          dueDate,
          status: 'DRAFT',
          subtotal: transaction.subtotal,
          taxAmount: transaction.taxAmount,
          discountAmount: transaction.discountAmount,
          totalAmount: transaction.totalAmount,
          paidAmount: 0,
          balanceAmount: transaction.totalAmount,
          paymentTerms: 'Net 30',
          paymentTermsDays: 30,
          notes: `Invoice generated from transaction ${transaction.transactionNo}`,
          termsConditions: 'Payment is due within the specified period. Late payments may incur additional charges.',
          template: 'modern',
          currency: 'USD',
          exchangeRate: 1,
          billingAddress: transaction.customer?.address || '',
          shippingAddress: transaction.customer?.address || '',
          isRecurring: false,
          remindersSent: 0,
        },
      })

      // Create invoice items from transaction items
      if (transaction.items && transaction.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: transaction.items.map((item) => ({
            invoiceId: invoice.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            totalAmount: item.totalAmount,
          })),
        })
      }

      return invoice
    })

    // Fetch the complete invoice with relations
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: result.id },
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

    return NextResponse.json(completeInvoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice from transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice from transaction' },
      { status: 500 }
    )
  }
}
