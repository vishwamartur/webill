import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        salesTransactions: {
          take: 10,
          orderBy: { date: 'desc' },
        },
        purchaseTransactions: {
          take: 10,
          orderBy: { date: 'desc' },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(party)
  } catch (error) {
    console.error('Error fetching party:', error)
    return NextResponse.json(
      { error: 'Failed to fetch party' },
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

    const party = await prisma.party.update({
      where: { id },
      data: {
        type: body.type,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        taxNumber: body.taxNumber,
        paymentTerms: body.paymentTerms ? parseInt(body.paymentTerms) : null,
        creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : null,
        notes: body.notes,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(party)
  } catch (error) {
    console.error('Error updating party:', error)
    return NextResponse.json(
      { error: 'Failed to update party' },
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
    await prisma.party.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Party deleted successfully' })
  } catch (error) {
    console.error('Error deleting party:', error)
    return NextResponse.json(
      { error: 'Failed to delete party' },
      { status: 500 }
    )
  }
}
