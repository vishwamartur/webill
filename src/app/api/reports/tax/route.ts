import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const period = searchParams.get('period') || 'this-quarter'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFrom: Date
    let dateTo: Date

    if (startDate && endDate) {
      dateFrom = startOfDay(new Date(startDate))
      dateTo = endOfDay(new Date(endDate))
    } else {
      const now = new Date()
      switch (period) {
        case 'this-month':
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
          break
        case 'this-quarter':
          dateFrom = startOfQuarter(now)
          dateTo = endOfQuarter(now)
          break
        case 'this-year':
          dateFrom = startOfYear(now)
          dateTo = endOfYear(now)
          break
        default:
          dateFrom = startOfQuarter(now)
          dateTo = endOfQuarter(now)
      }
    }

    switch (reportType) {
      case 'summary':
        return await generateTaxSummaryReport(dateFrom, dateTo)
      case 'gst-return':
        return await generateGSTReturnReport(dateFrom, dateTo)
      case 'liability':
        return await generateTaxLiabilityReport(dateFrom, dateTo)
      case 'compliance':
        return await generateTaxComplianceReport(dateFrom, dateTo)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating tax report:', error)
    return NextResponse.json(
      { error: 'Failed to generate tax report' },
      { status: 500 }
    )
  }
}

async function generateTaxSummaryReport(dateFrom: Date, dateTo: Date) {
  // Sales tax collected (Output Tax)
  const salesTaxData = await prisma.transaction.aggregate({
    where: {
      type: 'SALE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    _sum: {
      taxAmount: true,
      totalAmount: true,
      subtotal: true,
    },
    _count: true,
  })

  // Purchase tax paid (Input Tax)
  const purchaseTaxData = await prisma.transaction.aggregate({
    where: {
      type: 'PURCHASE',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    _sum: {
      taxAmount: true,
      totalAmount: true,
      subtotal: true,
    },
    _count: true,
  })

  // GST by rate from sales transactions
  const salesGSTByRate = await prisma.$queryRaw`
    SELECT
      COALESCE(ti."igstRate", ti."cgstRate" + ti."sgstRate", ti."taxRate") as gst_rate,
      SUM(ti."totalAmount" - COALESCE(ti."cgstAmount", 0) - COALESCE(ti."sgstAmount", 0) - COALESCE(ti."igstAmount", 0))::decimal as taxable_amount,
      SUM(COALESCE(ti."cgstAmount", 0))::decimal as cgst_amount,
      SUM(COALESCE(ti."sgstAmount", 0))::decimal as sgst_amount,
      SUM(COALESCE(ti."igstAmount", 0))::decimal as igst_amount,
      SUM(COALESCE(ti."cessAmount", 0))::decimal as cess_amount,
      SUM(COALESCE(ti."cgstAmount", 0) + COALESCE(ti."sgstAmount", 0) + COALESCE(ti."igstAmount", 0))::decimal as total_gst_amount,
      COUNT(*)::int as transaction_count
    FROM transaction_items ti
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND (ti."cgstRate" > 0 OR ti."sgstRate" > 0 OR ti."igstRate" > 0 OR ti."taxRate" > 0)
    GROUP BY COALESCE(ti."igstRate", ti."cgstRate" + ti."sgstRate", ti."taxRate")
    ORDER BY gst_rate
  ` as Array<{
    gst_rate: number
    taxable_amount: number
    cgst_amount: number
    sgst_amount: number
    igst_amount: number
    cess_amount: number
    total_gst_amount: number
    transaction_count: number
  }>

  // Purchase GST by rate (Input Tax Credit)
  const purchaseGSTByRate = await prisma.$queryRaw`
    SELECT
      COALESCE(ti."igstRate", ti."cgstRate" + ti."sgstRate", ti."taxRate") as gst_rate,
      SUM(ti."totalAmount" - COALESCE(ti."cgstAmount", 0) - COALESCE(ti."sgstAmount", 0) - COALESCE(ti."igstAmount", 0))::decimal as taxable_amount,
      SUM(COALESCE(ti."cgstAmount", 0))::decimal as cgst_amount,
      SUM(COALESCE(ti."sgstAmount", 0))::decimal as sgst_amount,
      SUM(COALESCE(ti."igstAmount", 0))::decimal as igst_amount,
      SUM(COALESCE(ti."cessAmount", 0))::decimal as cess_amount,
      SUM(COALESCE(ti."cgstAmount", 0) + COALESCE(ti."sgstAmount", 0) + COALESCE(ti."igstAmount", 0))::decimal as total_gst_amount,
      COUNT(*)::int as transaction_count
    FROM transaction_items ti
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'PURCHASE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND (ti."cgstRate" > 0 OR ti."sgstRate" > 0 OR ti."igstRate" > 0 OR ti."taxRate" > 0)
    GROUP BY COALESCE(ti."igstRate", ti."cgstRate" + ti."sgstRate", ti."taxRate")
    ORDER BY gst_rate
  ` as Array<{
    gst_rate: number
    taxable_amount: number
    cgst_amount: number
    sgst_amount: number
    igst_amount: number
    cess_amount: number
    total_gst_amount: number
    transaction_count: number
  }>

  // Invoice tax collected
  const invoiceTaxData = await prisma.invoice.aggregate({
    where: {
      issueDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    _sum: {
      taxAmount: true,
      totalAmount: true,
      subtotal: true,
    },
    _count: true,
  })

  // Calculate GST totals
  const outputGST = Number(salesTaxData._sum.taxAmount || 0) + Number(invoiceTaxData._sum.taxAmount || 0)
  const inputGST = Number(purchaseTaxData._sum.taxAmount || 0)
  const netGSTLiability = outputGST - inputGST

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    summary: {
      outputGST: {
        fromSales: Number(salesTaxData._sum.taxAmount || 0),
        fromInvoices: Number(invoiceTaxData._sum.taxAmount || 0),
        total: outputGST,
      },
      inputGST: {
        fromPurchases: Number(purchaseTaxData._sum.taxAmount || 0),
        total: inputGST,
      },
      netGSTLiability,
      taxableRevenue: Number(salesTaxData._sum.subtotal || 0) + Number(invoiceTaxData._sum.subtotal || 0),
      taxablePurchases: Number(purchaseTaxData._sum.subtotal || 0),
    },
    breakdown: {
      salesGSTByRate: salesGSTByRate.map(rate => ({
        rate: Number(rate.gst_rate),
        taxableAmount: Number(rate.taxable_amount),
        cgstAmount: Number(rate.cgst_amount),
        sgstAmount: Number(rate.sgst_amount),
        igstAmount: Number(rate.igst_amount),
        cessAmount: Number(rate.cess_amount),
        totalGSTAmount: Number(rate.total_gst_amount),
        transactionCount: rate.transaction_count,
      })),
      purchaseGSTByRate: purchaseGSTByRate.map(rate => ({
        rate: Number(rate.gst_rate),
        taxableAmount: Number(rate.taxable_amount),
        cgstAmount: Number(rate.cgst_amount),
        sgstAmount: Number(rate.sgst_amount),
        igstAmount: Number(rate.igst_amount),
        cessAmount: Number(rate.cess_amount),
        totalGSTAmount: Number(rate.total_gst_amount),
        transactionCount: rate.transaction_count,
      })),
    },
    transactions: {
      salesCount: salesTaxData._count,
      purchaseCount: purchaseTaxData._count,
      invoiceCount: invoiceTaxData._count,
    },
  }

  return NextResponse.json(report)
}

async function generateGSTReturnReport(dateFrom: Date, dateTo: Date) {
  // GST Return format (simplified for Indian GST)
  
  // Outward supplies (Sales)
  const outwardSupplies = await prisma.$queryRaw`
    SELECT
      'Taxable' as supply_type,
      ti."taxRate",
      SUM(ti."totalAmount" - (ti."totalAmount" * ti."taxRate" / (100 + ti."taxRate")))::decimal as taxable_value,
      SUM(ti."totalAmount" * ti."taxRate" / (100 + ti."taxRate"))::decimal as tax_amount,
      COUNT(DISTINCT t.id)::int as invoice_count
    FROM transaction_items ti
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND ti."taxRate" > 0
    GROUP BY ti."taxRate"

    UNION ALL

    SELECT
      'Exempt' as supply_type,
      0 as tax_rate,
      SUM(ti."totalAmount")::decimal as taxable_value,
      0::decimal as tax_amount,
      COUNT(DISTINCT t.id)::int as invoice_count
    FROM transaction_items ti
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'SALE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND ti."taxRate" = 0
    GROUP BY ti."taxRate"

    ORDER BY tax_rate
  ` as Array<{
    supply_type: string
    taxRate: number
    taxable_value: number
    tax_amount: number
    invoice_count: number
  }>

  // Inward supplies (Purchases)
  const inwardSupplies = await prisma.$queryRaw`
    SELECT
      'Taxable' as supply_type,
      ti."taxRate",
      SUM(ti."totalAmount" - (ti."totalAmount" * ti."taxRate" / (100 + ti."taxRate")))::decimal as taxable_value,
      SUM(ti."totalAmount" * ti."taxRate" / (100 + ti."taxRate"))::decimal as tax_amount,
      COUNT(DISTINCT t.id)::int as invoice_count
    FROM transaction_items ti
    JOIN transactions t ON ti."transactionId" = t.id
    WHERE t."type" = 'PURCHASE'
      AND t."date" >= ${dateFrom}
      AND t."date" <= ${dateTo}
      AND ti."taxRate" > 0
    GROUP BY ti."taxRate"
    ORDER BY ti."taxRate"
  ` as Array<{
    supply_type: string
    taxRate: number
    taxable_value: number
    tax_amount: number
    invoice_count: number
  }>

  // Calculate totals
  const totalOutwardTaxableValue = outwardSupplies.reduce((sum, supply) => sum + Number(supply.taxable_value), 0)
  const totalOutwardTax = outwardSupplies.reduce((sum, supply) => sum + Number(supply.tax_amount), 0)
  const totalInwardTaxableValue = inwardSupplies.reduce((sum, supply) => sum + Number(supply.taxable_value), 0)
  const totalInwardTax = inwardSupplies.reduce((sum, supply) => sum + Number(supply.tax_amount), 0)

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    gstReturn: {
      outwardSupplies: {
        supplies: outwardSupplies.map(supply => ({
          supplyType: supply.supply_type,
          taxRate: supply.taxRate,
          taxableValue: Number(supply.taxable_value),
          taxAmount: Number(supply.tax_amount),
          invoiceCount: supply.invoice_count,
        })),
        totals: {
          taxableValue: totalOutwardTaxableValue,
          taxAmount: totalOutwardTax,
        },
      },
      inwardSupplies: {
        supplies: inwardSupplies.map(supply => ({
          supplyType: supply.supply_type,
          taxRate: supply.taxRate,
          taxableValue: Number(supply.taxable_value),
          taxAmount: Number(supply.tax_amount),
          invoiceCount: supply.invoice_count,
        })),
        totals: {
          taxableValue: totalInwardTaxableValue,
          taxAmount: totalInwardTax,
        },
      },
      netTaxLiability: totalOutwardTax - totalInwardTax,
    },
  }

  return NextResponse.json(report)
}

async function generateTaxLiabilityReport(dateFrom: Date, dateTo: Date) {
  // Monthly tax liability breakdown
  const monthlyLiability = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', t.date) as month,
      SUM(CASE WHEN t.type = 'SALE' THEN t.tax_amount ELSE 0 END)::decimal as output_tax,
      SUM(CASE WHEN t.type = 'PURCHASE' THEN t.tax_amount ELSE 0 END)::decimal as input_tax,
      SUM(CASE WHEN t.type = 'SALE' THEN t.tax_amount ELSE 0 END - CASE WHEN t.type = 'PURCHASE' THEN t.tax_amount ELSE 0 END)::decimal as net_liability
    FROM transactions t
    WHERE t.date >= ${dateFrom} 
      AND t.date <= ${dateTo}
      AND t.type IN ('SALE', 'PURCHASE')
    GROUP BY DATE_TRUNC('month', t.date)
    ORDER BY month
  ` as Array<{
    month: Date
    output_tax: number
    input_tax: number
    net_liability: number
  }>

  // Tax payments made
  const taxPayments = await prisma.transaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'Tax Payment',
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      id: true,
      date: true,
      totalAmount: true,
      description: true,
      reference: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  const totalTaxPaid = taxPayments.reduce((sum, payment) => sum + Number(payment.totalAmount), 0)
  const totalLiability = monthlyLiability.reduce((sum, month) => sum + Number(month.net_liability), 0)
  const outstandingLiability = totalLiability - totalTaxPaid

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    liability: {
      totalOutputTax: monthlyLiability.reduce((sum, month) => sum + Number(month.output_tax), 0),
      totalInputTax: monthlyLiability.reduce((sum, month) => sum + Number(month.input_tax), 0),
      totalNetLiability: totalLiability,
      totalTaxPaid,
      outstandingLiability,
    },
    monthlyBreakdown: monthlyLiability.map(month => ({
      month: month.month,
      outputTax: Number(month.output_tax),
      inputTax: Number(month.input_tax),
      netLiability: Number(month.net_liability),
    })),
    taxPayments: taxPayments.map(payment => ({
      id: payment.id,
      date: payment.date,
      amount: Number(payment.totalAmount),
      description: payment.description,
      reference: payment.reference,
    })),
  }

  return NextResponse.json(report)
}

async function generateTaxComplianceReport(dateFrom: Date, dateTo: Date) {
  // Check for missing tax information
  const transactionsWithoutTax = await prisma.transaction.count({
    where: {
      type: {
        in: ['SALE', 'PURCHASE'],
      },
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      taxAmount: 0,
    },
  })

  // Check for invoices without proper tax details
  const invoicesWithoutTax = await prisma.invoice.count({
    where: {
      issueDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      taxAmount: 0,
      status: {
        not: 'CANCELLED',
      },
    },
  })

  // Check for parties without tax numbers
  const partiesWithoutTaxNumber = await prisma.party.count({
    where: {
      type: {
        in: ['CUSTOMER', 'SUPPLIER'],
      },
      isActive: true,
      OR: [
        { taxNumber: null },
        { taxNumber: '' },
      ],
    },
  })

  // Items without tax rates
  const itemsWithoutTaxRate = await prisma.item.count({
    where: {
      isActive: true,
      taxRate: 0,
    },
  })

  // High-value transactions that might need special attention
  const highValueTransactions = await prisma.transaction.findMany({
    where: {
      type: {
        in: ['SALE', 'PURCHASE'],
      },
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      totalAmount: {
        gte: 50000, // Transactions above 50,000
      },
    },
    select: {
      id: true,
      transactionNo: true,
      type: true,
      date: true,
      totalAmount: true,
      taxAmount: true,
      customer: {
        select: {
          name: true,
          taxNumber: true,
        },
      },
      supplier: {
        select: {
          name: true,
          taxNumber: true,
        },
      },
    },
    orderBy: {
      totalAmount: 'desc',
    },
    take: 20,
  })

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    compliance: {
      issues: {
        transactionsWithoutTax,
        invoicesWithoutTax,
        partiesWithoutTaxNumber,
        itemsWithoutTaxRate,
      },
      recommendations: [
        ...(transactionsWithoutTax > 0 ? [`${transactionsWithoutTax} transactions are missing tax information`] : []),
        ...(invoicesWithoutTax > 0 ? [`${invoicesWithoutTax} invoices are missing tax details`] : []),
        ...(partiesWithoutTaxNumber > 0 ? [`${partiesWithoutTaxNumber} parties are missing tax numbers`] : []),
        ...(itemsWithoutTaxRate > 0 ? [`${itemsWithoutTaxRate} items are missing tax rates`] : []),
      ],
      complianceScore: Math.max(0, 100 - (
        (transactionsWithoutTax * 5) +
        (invoicesWithoutTax * 5) +
        (partiesWithoutTaxNumber * 2) +
        (itemsWithoutTaxRate * 1)
      )),
    },
    highValueTransactions: highValueTransactions.map(transaction => ({
      id: transaction.id,
      transactionNo: transaction.transactionNo,
      type: transaction.type,
      date: transaction.date,
      totalAmount: Number(transaction.totalAmount),
      taxAmount: Number(transaction.taxAmount),
      partyName: transaction.customer?.name || transaction.supplier?.name || 'Unknown',
      partyTaxNumber: transaction.customer?.taxNumber || transaction.supplier?.taxNumber,
      taxRate: transaction.totalAmount > 0 ? (Number(transaction.taxAmount) / Number(transaction.totalAmount)) * 100 : 0,
    })),
  }

  return NextResponse.json(report)
}
