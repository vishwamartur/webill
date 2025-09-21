import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/reports/dashboard/route'
import prisma from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    transaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      aggregate: jest.fn(),
    },
    party: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

describe('/api/reports/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns dashboard data successfully', async () => {
    // Mock Prisma responses
    ;(prisma.transaction.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalAmount: 10000 },
      _count: 50,
    })
    ;(prisma.invoice.aggregate as jest.Mock).mockResolvedValue({
      _sum: { totalAmount: 8000 },
      _count: 30,
    })
    ;(prisma.party.count as jest.Mock).mockResolvedValue(25)
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { date: '2024-01-01', revenue: 1000 },
      { date: '2024-01-02', revenue: 1500 },
    ])

    const { req } = createMocks({
      method: 'GET',
      url: '/api/reports/dashboard?period=this-month',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('kpis')
    expect(data).toHaveProperty('trends')
    expect(data.kpis).toHaveProperty('totalRevenue')
    expect(data.kpis).toHaveProperty('totalInvoices')
    expect(data.kpis).toHaveProperty('totalCustomers')
  })

  it('handles invalid period parameter', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/reports/dashboard?period=invalid',
    })

    const response = await GET(req)
    
    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    ;(prisma.transaction.aggregate as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    )

    const { req } = createMocks({
      method: 'GET',
      url: '/api/reports/dashboard?period=this-month',
    })

    const response = await GET(req)
    
    expect(response.status).toBe(500)
  })
})
