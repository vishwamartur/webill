import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@/generated/prisma'
import { generateInvoiceNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status') as InvoiceStatus | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
        { poNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
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
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate invoice number
    const invoiceNo = generateInvoiceNumber()
    
    // Calculate due date based on payment terms
    const issueDate = new Date(body.issueDate || Date.now())
    const paymentTermsDays = body.paymentTermsDays || 30
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + paymentTermsDays)
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: body.customerId,
          transactionId: body.transactionId || null,
          issueDate,
          dueDate,
          status: body.status || 'DRAFT',
          subtotal: parseFloat(body.subtotal),
          taxAmount: parseFloat(body.taxAmount || '0'),
          discountAmount: parseFloat(body.discountAmount || '0'),
          totalAmount: parseFloat(body.totalAmount),
          paidAmount: parseFloat(body.paidAmount || '0'),
          balanceAmount: parseFloat(body.totalAmount) - parseFloat(body.paidAmount || '0'),
          paymentTerms: body.paymentTerms,
          paymentTermsDays: paymentTermsDays,
          notes: body.notes,
          termsConditions: body.termsConditions,
          template: body.template || 'modern',
          currency: body.currency || 'USD',
          exchangeRate: parseFloat(body.exchangeRate || '1'),
          billingAddress: body.billingAddress,
          shippingAddress: body.shippingAddress,
          poNumber: body.poNumber,
          reference: body.reference,
          isRecurring: body.isRecurring || false,
          recurringPeriod: body.recurringPeriod,
          nextInvoiceDate: body.nextInvoiceDate ? new Date(body.nextInvoiceDate) : null,
        },
      })

      // Create invoice items
      if (body.items && body.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: body.items.map((item: any) => ({
            invoiceId: invoice.id,
            itemId: item.itemId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || '0'),
            taxRate: parseFloat(item.taxRate || '0'),
            totalAmount: parseFloat(item.totalAmount),
          })),
        })
      }

      // If creating from a transaction, link them
      if (body.transactionId) {
        await tx.transaction.update({
          where: { id: body.transactionId },
          data: { 
            // You might want to add an invoiceStatus field to transactions
            notes: `Invoice ${invoiceNo} generated from this transaction`,
          },
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
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
