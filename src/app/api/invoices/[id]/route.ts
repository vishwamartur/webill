import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        transaction: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Calculate due date if payment terms changed
    let dueDate = body.dueDate ? new Date(body.dueDate) : undefined
    if (body.paymentTermsDays && body.issueDate) {
      const issueDate = new Date(body.issueDate)
      dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + parseInt(body.paymentTermsDays))
    }
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })

      // Update the invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: params.id },
        data: {
          customerId: body.customerId,
          transactionId: body.transactionId || null,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate,
          status: body.status,
          subtotal: body.subtotal ? parseFloat(body.subtotal) : undefined,
          taxAmount: body.taxAmount ? parseFloat(body.taxAmount) : undefined,
          discountAmount: body.discountAmount ? parseFloat(body.discountAmount) : undefined,
          totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : undefined,
          paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : undefined,
          balanceAmount: body.totalAmount && body.paidAmount 
            ? parseFloat(body.totalAmount) - parseFloat(body.paidAmount)
            : undefined,
          paymentTerms: body.paymentTerms,
          paymentTermsDays: body.paymentTermsDays ? parseInt(body.paymentTermsDays) : undefined,
          notes: body.notes,
          termsConditions: body.termsConditions,
          template: body.template,
          currency: body.currency,
          exchangeRate: body.exchangeRate ? parseFloat(body.exchangeRate) : undefined,
          billingAddress: body.billingAddress,
          shippingAddress: body.shippingAddress,
          poNumber: body.poNumber,
          reference: body.reference,
          isRecurring: body.isRecurring,
          recurringPeriod: body.recurringPeriod,
          nextInvoiceDate: body.nextInvoiceDate ? new Date(body.nextInvoiceDate) : undefined,
          sentDate: body.sentDate ? new Date(body.sentDate) : undefined,
          remindersSent: body.remindersSent ? parseInt(body.remindersSent) : undefined,
          lastReminderDate: body.lastReminderDate ? new Date(body.lastReminderDate) : undefined,
        },
      })

      // Create new invoice items
      if (body.items && body.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: body.items.map((item: any) => ({
            invoiceId: params.id,
            itemId: item.itemId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || '0'),
            taxRate: parseFloat(item.taxRate || '0'),
            totalAmount: parseFloat(item.totalAmount),
          })),
        })
      }

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
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if invoice can be deleted (only DRAFT invoices should be deletable)
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      )
    }

    // Delete the invoice (cascade will handle items)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
