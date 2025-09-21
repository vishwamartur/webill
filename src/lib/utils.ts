import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  // Use Indian locale for INR formatting
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Fallback for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatIndianNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function generateTransactionNumber(type: string): string {
  const prefix = type.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  return `INV-${year}-${timestamp}`
}

// GST-related utility functions
export function validateGSTIN(gstin: string): boolean {
  // GSTIN format: 15 characters - 2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

export function validatePAN(pan: string): boolean {
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

export function calculateGST(amount: number, gstRate: number, isInterState: boolean = false) {
  const gstAmount = (amount * gstRate) / 100

  if (isInterState) {
    // Inter-state: IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: gstAmount
    }
  } else {
    // Intra-state: CGST + SGST
    const cgst = gstAmount / 2
    const sgst = gstAmount / 2
    return {
      cgst,
      sgst,
      igst: 0,
      total: gstAmount
    }
  }
}

export function getGSTRates(): number[] {
  const rates = process.env.GST_RATES || '0,5,12,18,28'
  return rates.split(',').map(rate => parseFloat(rate))
}

export function getDefaultGSTRate(): number {
  return parseFloat(process.env.DEFAULT_GST_RATE || '18')
}

export function isInterStateTransaction(supplierState: string, customerState: string): boolean {
  return supplierState !== customerState
}
