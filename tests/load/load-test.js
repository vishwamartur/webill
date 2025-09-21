import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
}

const BASE_URL = __ENV.STAGING_URL || 'http://localhost:3000'

export default function () {
  // Test homepage
  let response = http.get(`${BASE_URL}/`)
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1)

  sleep(1)

  // Test dashboard
  response = http.get(`${BASE_URL}/dashboard`)
  check(response, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard loads in <3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1)

  sleep(1)

  // Test reports API
  response = http.get(`${BASE_URL}/api/reports/dashboard?period=this-month`)
  check(response, {
    'reports API status is 200': (r) => r.status === 200,
    'reports API responds in <5s': (r) => r.timings.duration < 5000,
    'reports API returns JSON': (r) => r.headers['Content-Type'].includes('application/json'),
  }) || errorRate.add(1)

  sleep(1)

  // Test health check
  response = http.get(`${BASE_URL}/api/health`)
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds quickly': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1)

  sleep(2)
}
