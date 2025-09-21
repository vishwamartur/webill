#!/usr/bin/env node

const https = require('https')
const http = require('http')

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://webill.vercel.app'
const TIMEOUT = 30000 // 30 seconds

const healthChecks = [
  {
    name: 'Homepage',
    path: '/',
    expectedStatus: 200,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    expectedStatus: 200,
  },
  {
    name: 'Reports API',
    path: '/api/reports/dashboard?period=this-month',
    expectedStatus: 200,
  },
  {
    name: 'Health Check API',
    path: '/api/health',
    expectedStatus: 200,
  },
]

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    
    const req = client.get(url, { timeout: TIMEOUT }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        })
      })
    })
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function runHealthCheck(check) {
  const url = `${PRODUCTION_URL}${check.path}`
  
  try {
    console.log(`🔍 Checking ${check.name}...`)
    const response = await makeRequest(url)
    
    if (response.status === check.expectedStatus) {
      console.log(`✅ ${check.name}: OK (${response.status})`)
      return true
    } else {
      console.log(`❌ ${check.name}: FAILED (${response.status}, expected ${check.expectedStatus})`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ERROR - ${error.message}`)
    return false
  }
}

async function main() {
  console.log(`🏥 Running health checks for ${PRODUCTION_URL}`)
  console.log('=' * 50)
  
  const results = await Promise.all(
    healthChecks.map(check => runHealthCheck(check))
  )
  
  const passed = results.filter(Boolean).length
  const total = results.length
  
  console.log('=' * 50)
  console.log(`📊 Health Check Results: ${passed}/${total} passed`)
  
  if (passed === total) {
    console.log('🎉 All health checks passed!')
    process.exit(0)
  } else {
    console.log('💥 Some health checks failed!')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Health check script failed:', error)
  process.exit(1)
})
