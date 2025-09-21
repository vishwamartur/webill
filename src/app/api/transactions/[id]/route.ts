import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        supplier: true,
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

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
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
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the current transaction to check for inventory changes
      const currentTransaction = await tx.transaction.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      if (!currentTransaction) {
        throw new Error('Transaction not found')
      }

      // Revert inventory changes from the original transaction
      if (currentTransaction.type === 'SALE') {
        for (const item of currentTransaction.items) {
          if (!item.item.isService) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            })
          }
        }
      } else if (currentTransaction.type === 'PURCHASE') {
        for (const item of currentTransaction.items) {
          if (!item.item.isService) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }
      }

      // Delete existing transaction items
      await tx.transactionItem.deleteMany({
        where: { transactionId: params.id },
      })

      // Update the transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: params.id },
        data: {
          date: new Date(body.date),
          customerId: body.customerId || null,
          supplierId: body.supplierId || null,
          subtotal: parseFloat(body.subtotal),
          taxAmount: parseFloat(body.taxAmount || '0'),
          discountAmount: parseFloat(body.discountAmount || '0'),
          totalAmount: parseFloat(body.totalAmount),
          paymentStatus: body.paymentStatus,
          paymentMethod: body.paymentMethod || null,
          notes: body.notes,
        },
      })

      // Create new transaction items
      if (body.items && body.items.length > 0) {
        await tx.transactionItem.createMany({
          data: body.items.map((item: any) => ({
            transactionId: params.id,
            itemId: item.itemId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || '0'),
            taxRate: parseFloat(item.taxRate || '0'),
            totalAmount: parseFloat(item.totalAmount),
          })),
        })

        // Apply new inventory changes
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
        } else if (body.type === 'PURCHASE') {
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

      return updatedTransaction
    })

    // Fetch the complete updated transaction
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(completeTransaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Get the transaction to revert inventory changes
      const transaction = await tx.transaction.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // Revert inventory changes
      if (transaction.type === 'SALE') {
        for (const item of transaction.items) {
          if (!item.item.isService) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            })
          }
        }
      } else if (transaction.type === 'PURCHASE') {
        for (const item of transaction.items) {
          if (!item.item.isService) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }
      }

      // Delete the transaction (cascade will handle items and payments)
      await tx.transaction.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
