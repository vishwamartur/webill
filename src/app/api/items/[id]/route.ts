import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        transactionItems: {
          take: 10,
          orderBy: { transaction: { date: 'desc' } },
          include: {
            transaction: {
              include: {
                customer: true,
                supplier: true,
              },
            },
          },
        },
        invoiceItems: {
          take: 10,
          orderBy: { invoice: { createdAt: 'desc' } },
          include: {
            invoice: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        barcode: body.barcode,
        categoryId: body.categoryId || null,
        unitPrice: parseFloat(body.unitPrice),
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        stockQuantity: parseInt(body.stockQuantity) || 0,
        minStock: parseInt(body.minStock) || 0,
        unit: body.unit || 'pcs',
        taxRate: parseFloat(body.taxRate) || 0,
        isActive: body.isActive,
        isService: body.isService,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.item.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
