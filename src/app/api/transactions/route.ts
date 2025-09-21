import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, PaymentStatus, PaymentMethod } from '@/generated/prisma'
import { generateTransactionNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const types = typeParam ? typeParam.split(',').map(t => t.trim() as TransactionType) : null
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status') as PaymentStatus | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (types) {
      if (types.length === 1) {
        where.type = types[0]
      } else {
        where.type = { in: types }
      }
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (status) {
      where.paymentStatus = status
    }
    
    if (search) {
      where.OR = [
        { transactionNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          customer: true,
          supplier: true,
          items: {
            include: {
              item: true,
            },
          },
          payments: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate transaction number
    const transactionNo = generateTransactionNumber(body.type)
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transactionData: any = {
        type: body.type,
        transactionNo,
        date: new Date(body.date || Date.now()),
        paymentStatus: body.paymentStatus || 'PENDING',
        paymentMethod: body.paymentMethod || null,
        notes: body.notes,
      }

      // For EXPENSE and INCOME transactions, use amount directly
      if (body.type === 'EXPENSE' || body.type === 'INCOME') {
        transactionData.totalAmount = parseFloat(body.amount || body.totalAmount)
        transactionData.subtotal = parseFloat(body.amount || body.totalAmount)
        transactionData.taxAmount = 0
        transactionData.discountAmount = 0
        // Add description and category for expense/income
        transactionData.description = body.description
        transactionData.category = body.category
        transactionData.reference = body.reference
      } else {
        // For SALE and PURCHASE transactions
        transactionData.customerId = body.customerId || null
        transactionData.supplierId = body.supplierId || null
        transactionData.subtotal = parseFloat(body.subtotal)
        transactionData.taxAmount = parseFloat(body.taxAmount || '0')
        transactionData.discountAmount = parseFloat(body.discountAmount || '0')
        transactionData.totalAmount = parseFloat(body.totalAmount)
      }

      const transaction = await tx.transaction.create({
        data: transactionData,
      })

      // Create transaction items (only for SALE and PURCHASE transactions)
      if (body.items && body.items.length > 0 && (body.type === 'SALE' || body.type === 'PURCHASE')) {
        await tx.transactionItem.createMany({
          data: body.items.map((item: any) => ({
            transactionId: transaction.id,
            itemId: item.itemId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || '0'),
            taxRate: parseFloat(item.taxRate || '0'),
            totalAmount: parseFloat(item.totalAmount),
          })),
        })

        // Update inventory for sales transactions
        if (body.type === 'SALE') {
          for (const item of body.items) {
            const currentItem = await tx.item.findUnique({
              where: { id: item.itemId },
            })
            
            if (currentItem && !currentItem.isService) {
              await tx.item.update({
                where: { id: item.itemId },
                data: {
                  stockQuantity: {
                    decrement: parseInt(item.quantity),
                  },
                },
              })
            }
          }
        }

        // Update inventory for purchase transactions
        if (body.type === 'PURCHASE') {
          for (const item of body.items) {
            const currentItem = await tx.item.findUnique({
              where: { id: item.itemId },
            })
            
            if (currentItem && !currentItem.isService) {
              await tx.item.update({
                where: { id: item.itemId },
                data: {
                  stockQuantity: {
                    increment: parseInt(item.quantity),
                  },
                },
              })
            }
          }
        }
      }

      // Create payment record if payment is completed
      if (body.paymentStatus === 'COMPLETED' && body.paymentMethod) {
        await tx.payment.create({
          data: {
            paymentNo: `PAY-${Date.now()}`,
            transactionId: transaction.id,
            amount: parseFloat(body.totalAmount),
            paymentDate: new Date(),
            paymentMethod: body.paymentMethod,
            status: 'COMPLETED',
            reference: body.paymentReference,
            notes: body.paymentNotes,
          },
        })
      }

      return transaction
    })

    // Fetch the complete transaction with relations
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            item: true,
          },
        },
        payments: true,
      },
    })

    return NextResponse.json(completeTransaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
