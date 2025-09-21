import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PartyType } from '@/generated/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as PartyType | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [parties, total] = await Promise.all([
      prisma.party.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.party.count({ where }),
    ])

    return NextResponse.json({
      parties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching parties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const party = await prisma.party.create({
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
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(party, { status: 201 })
  } catch (error) {
    console.error('Error creating party:', error)
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    )
  }
}
