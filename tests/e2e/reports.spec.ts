import { test, expect } from '@playwright/test'

test.describe('Reports Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
  })

  test('should display reports dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Reports & Analytics')
    
    // Check for tab navigation
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Financial' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Sales' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Inventory' })).toBeVisible()
  })

  test('should switch between report tabs', async ({ page }) => {
    // Click on Financial tab
    await page.getByRole('tab', { name: 'Financial' }).click()
    await expect(page.locator('[data-testid="financial-reports"]')).toBeVisible()
    
    // Click on Sales tab
    await page.getByRole('tab', { name: 'Sales' }).click()
    await expect(page.locator('[data-testid="sales-analytics"]')).toBeVisible()
    
    // Click on Inventory tab
    await page.getByRole('tab', { name: 'Inventory' }).click()
    await expect(page.locator('[data-testid="inventory-reports"]')).toBeVisible()
  })

  test('should display KPI cards on dashboard tab', async ({ page }) => {
    // Ensure we're on the Dashboard tab
    await page.getByRole('tab', { name: 'Dashboard' }).click()
    
    // Check for KPI cards
    await expect(page.locator('[data-testid="total-revenue-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-invoices-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-customers-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-payments-card"]')).toBeVisible()
  })

  test('should display charts and visualizations', async ({ page }) => {
    // Check for revenue trend chart
    await expect(page.locator('[data-testid="revenue-trend-chart"]')).toBeVisible()
    
    // Check for category performance chart
    await expect(page.locator('[data-testid="category-performance-chart"]')).toBeVisible()
  })

  test('should allow period selection', async ({ page }) => {
    // Click on period selector
    await page.locator('[data-testid="period-selector"]').click()
    
    // Select different period
    await page.getByRole('option', { name: 'Last 3 Months' }).click()
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle')
    
    // Verify the selection is applied
    await expect(page.locator('[data-testid="period-selector"]')).toContainText('Last 3 Months')
  })

  test('should export reports', async ({ page }) => {
    // Click on export button
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    
    // Select export format
    await page.getByRole('menuitem', { name: 'Export as PDF' }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/.*\.pdf$/)
  })
})
