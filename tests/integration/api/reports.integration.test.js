const request = require('supertest')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3001

let app
let handle
let server

beforeAll(async () => {
  app = next({ dev, hostname, port })
  handle = app.getRequestHandler()
  
  await app.prepare()
  
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  
  await new Promise((resolve) => {
    server.listen(port, (err) => {
      if (err) throw err
      resolve()
    })
  })
})

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve)
    })
  }
  if (app) {
    await app.close()
  }
})

describe('Reports API Integration Tests', () => {
  describe('GET /api/reports/dashboard', () => {
    it('should return dashboard data with valid period', async () => {
      const response = await request(server)
        .get('/api/reports/dashboard?period=this-month')
        .expect(200)

      expect(response.body).toHaveProperty('kpis')
      expect(response.body).toHaveProperty('trends')
      expect(response.body.kpis).toHaveProperty('totalRevenue')
      expect(response.body.kpis).toHaveProperty('totalInvoices')
    })

    it('should handle invalid period parameter', async () => {
      await request(server)
        .get('/api/reports/dashboard?period=invalid')
        .expect(400)
    })
  })

  describe('GET /api/reports/financial', () => {
    it('should return financial report data', async () => {
      const response = await request(server)
        .get('/api/reports/financial?type=profit-loss&period=this-month')
        .expect(200)

      expect(response.body).toHaveProperty('summary')
      expect(response.body).toHaveProperty('details')
    })
  })

  describe('GET /api/reports/sales', () => {
    it('should return sales analytics data', async () => {
      const response = await request(server)
        .get('/api/reports/sales?type=overview&period=this-month')
        .expect(200)

      expect(response.body).toHaveProperty('summary')
      expect(response.body).toHaveProperty('trends')
    })
  })
})
