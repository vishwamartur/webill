import { test, expect } from '@playwright/test'

test.describe('Dashboard Smoke Tests', () => {
  test('dashboard page loads successfully', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/WeBill/)
    
    // Check for key dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Check for KPI cards
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-invoices"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-customers"]')).toBeVisible()
  })

  test('reports page loads successfully', async ({ page }) => {
    await page.goto('/reports')
    
    await expect(page).toHaveTitle(/Reports/)
    await expect(page.locator('h1')).toContainText('Reports')
    
    // Check for report tabs
    await expect(page.locator('[role="tablist"]')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Financial' })).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation to different pages
    await page.click('a[href="/dashboard"]')
    await expect(page).toHaveURL(/.*dashboard/)
    
    await page.click('a[href="/reports"]')
    await expect(page).toHaveURL(/.*reports/)
    
    await page.click('a[href="/invoices"]')
    await expect(page).toHaveURL(/.*invoices/)
  })

  test('API endpoints respond correctly', async ({ page }) => {
    // Test critical API endpoints
    const dashboardResponse = await page.request.get('/api/reports/dashboard?period=this-month')
    expect(dashboardResponse.status()).toBe(200)
    
    const financialResponse = await page.request.get('/api/reports/financial?type=profit-loss&period=this-month')
    expect(financialResponse.status()).toBe(200)
  })
})
