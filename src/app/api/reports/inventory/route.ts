import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || 'this-month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range for movement analysis
    let dateFrom: Date
    let dateTo: Date

    if (startDate && endDate) {
      dateFrom = startOfDay(new Date(startDate))
      dateTo = endOfDay(new Date(endDate))
    } else {
      const now = new Date()
      switch (period) {
        case 'today':
          dateFrom = startOfDay(now)
          dateTo = endOfDay(now)
          break
        case 'this-week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          dateFrom = startOfDay(startOfWeek)
          dateTo = endOfDay(new Date())
          break
        case 'this-month':
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
          break
        case 'last-month':
          const lastMonth = subMonths(now, 1)
          dateFrom = startOfMonth(lastMonth)
          dateTo = endOfMonth(lastMonth)
          break
        default:
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
      }
    }

    switch (reportType) {
      case 'overview':
        return await generateInventoryOverviewReport()
      case 'valuation':
        return await generateInventoryValuationReport()
      case 'movement':
        return await generateInventoryMovementReport(dateFrom, dateTo)
      case 'low-stock':
        return await generateLowStockReport()
      case 'turnover':
        return await generateInventoryTurnoverReport(dateFrom, dateTo)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return NextResponse.json(
      { error: 'Failed to generate inventory report' },
      { status: 500 }
    )
  }
}

async function generateInventoryOverviewReport() {
  // Total items and categories
  const totalItems = await prisma.item.count({
    where: { isActive: true }
  })

  const totalCategories = await prisma.category.count()

  // Stock summary
  const stockSummary = await prisma.item.aggregate({
    where: { 
      isActive: true,
      isService: false,
    },
    _sum: {
      stockQuantity: true,
    },
    _count: true,
  })

  // Items by stock status
  const inStockItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false,
      stockQuantity: { gt: 0 }
    }
  })

  const outOfStockItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false,
      stockQuantity: { lte: 0 }
    }
  })

  const lowStockItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false,
      stockQuantity: { gt: 0 },
      AND: {
        stockQuantity: { lte: prisma.item.fields.minStock }
      }
    }
  })

  // Items by category
  const itemsByCategory = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          items: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: {
      items: {
        _count: 'desc'
      }
    }
  })

  // Service vs Product breakdown
  const serviceItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: true
    }
  })

  const productItems = await prisma.item.count({
    where: {
      isActive: true,
      isService: false
    }
  })

  const report = {
    overview: {
      totalItems,
      totalCategories,
      totalStock: stockSummary._sum.stockQuantity || 0,
      physicalItems: stockSummary._count,
    },
    stockStatus: {
      inStock: inStockItems,
      outOfStock: outOfStockItems,
      lowStock: lowStockItems,
      stockPercentage: {
        inStock: totalItems > 0 ? (inStockItems / totalItems) * 100 : 0,
        outOfStock: totalItems > 0 ? (outOfStockItems / totalItems) * 100 : 0,
        lowStock: totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0,
      }
    },
    itemTypes: {
      products: productItems,
      services: serviceItems,
      productPercentage: totalItems > 0 ? (productItems / totalItems) * 100 : 0,
      servicePercentage: totalItems > 0 ? (serviceItems / totalItems) * 100 : 0,
    },
    categoryBreakdown: itemsByCategory.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      itemCount: category._count.items,
      percentage: totalItems > 0 ? (category._count.items / totalItems) * 100 : 0,
    })),
  }

  return NextResponse.json(report)
}

async function generateInventoryValuationReport() {
  // Get all items with their stock and pricing
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      isService: false,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      unitPrice: true,
      costPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  // Calculate valuations
  let totalCostValue = 0
  let totalRetailValue = 0
  let totalPotentialProfit = 0

  const itemValuations = items.map(item => {
    const costPrice = Number(item.costPrice || item.unitPrice)
    const retailPrice = Number(item.unitPrice)
    const quantity = item.stockQuantity

    const costValue = costPrice * quantity
    const retailValue = retailPrice * quantity
    const potentialProfit = retailValue - costValue

    totalCostValue += costValue
    totalRetailValue += retailValue
    totalPotentialProfit += potentialProfit

    return {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      category: item.category?.name || 'Uncategorized',
      quantity,
      costPrice,
      retailPrice,
      costValue,
      retailValue,
      potentialProfit,
      profitMargin: retailValue > 0 ? (potentialProfit / retailValue) * 100 : 0,
    }
  })

  // Sort by retail value descending
  itemValuations.sort((a, b) => b.retailValue - a.retailValue)

  // Category-wise valuation
  const categoryValuation = itemValuations.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = {
        categoryName: category,
        itemCount: 0,
        totalQuantity: 0,
        totalCostValue: 0,
        totalRetailValue: 0,
        totalPotentialProfit: 0,
      }
    }
    
    acc[category].itemCount += 1
    acc[category].totalQuantity += item.quantity
    acc[category].totalCostValue += item.costValue
    acc[category].totalRetailValue += item.retailValue
    acc[category].totalPotentialProfit += item.potentialProfit

    return acc
  }, {} as Record<string, any>)

  const report = {
    summary: {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.stockQuantity, 0),
      totalCostValue,
      totalRetailValue,
      totalPotentialProfit,
      overallProfitMargin: totalRetailValue > 0 ? (totalPotentialProfit / totalRetailValue) * 100 : 0,
    },
    topValueItems: itemValuations.slice(0, 20),
    categoryValuation: Object.values(categoryValuation).sort((a: any, b: any) => b.totalRetailValue - a.totalRetailValue),
  }

  return NextResponse.json(report)
}

async function generateInventoryMovementReport(dateFrom: Date, dateTo: Date) {
  // Sales movements (outgoing)
  const salesMovements = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        type: 'SALE',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    },
    select: {
      itemId: true,
      quantity: true,
      totalAmount: true,
      transaction: {
        select: {
          date: true,
          transactionNo: true,
        },
      },
      item: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  })

  // Purchase movements (incoming)
  const purchaseMovements = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        type: 'PURCHASE',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    },
    select: {
      itemId: true,
      quantity: true,
      totalAmount: true,
      transaction: {
        select: {
          date: true,
          transactionNo: true,
        },
      },
      item: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  })

  // Aggregate movements by item
  const itemMovements = new Map()

  // Process sales (outgoing)
  salesMovements.forEach(movement => {
    const key = movement.itemId
    if (!itemMovements.has(key)) {
      itemMovements.set(key, {
        itemId: movement.itemId,
        itemName: movement.item.name,
        sku: movement.item.sku,
        totalSold: 0,
        totalPurchased: 0,
        salesValue: 0,
        purchaseValue: 0,
        netMovement: 0,
      })
    }
    
    const item = itemMovements.get(key)
    item.totalSold += movement.quantity
    item.salesValue += Number(movement.totalAmount)
    item.netMovement -= movement.quantity
  })

  // Process purchases (incoming)
  purchaseMovements.forEach(movement => {
    const key = movement.itemId
    if (!itemMovements.has(key)) {
      itemMovements.set(key, {
        itemId: movement.itemId,
        itemName: movement.item.name,
        sku: movement.item.sku,
        totalSold: 0,
        totalPurchased: 0,
        salesValue: 0,
        purchaseValue: 0,
        netMovement: 0,
      })
    }
    
    const item = itemMovements.get(key)
    item.totalPurchased += movement.quantity
    item.purchaseValue += Number(movement.totalAmount)
    item.netMovement += movement.quantity
  })

  const movementArray = Array.from(itemMovements.values())

  // Sort by total movement (sales + purchases)
  movementArray.sort((a, b) => (b.totalSold + b.totalPurchased) - (a.totalSold + a.totalPurchased))

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    summary: {
      totalItemsWithMovement: movementArray.length,
      totalQuantitySold: movementArray.reduce((sum, item) => sum + item.totalSold, 0),
      totalQuantityPurchased: movementArray.reduce((sum, item) => sum + item.totalPurchased, 0),
      totalSalesValue: movementArray.reduce((sum, item) => sum + item.salesValue, 0),
      totalPurchaseValue: movementArray.reduce((sum, item) => sum + item.purchaseValue, 0),
    },
    itemMovements: movementArray.slice(0, 50), // Top 50 most active items
    topSellers: movementArray
      .filter(item => item.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 20),
    topPurchases: movementArray
      .filter(item => item.totalPurchased > 0)
      .sort((a, b) => b.totalPurchased - a.totalPurchased)
      .slice(0, 20),
  }

  return NextResponse.json(report)
}

async function generateLowStockReport() {
  // Items with low stock (at or below minimum stock level)
  const lowStockItems = await prisma.item.findMany({
    where: {
      isActive: true,
      isService: false,
      OR: [
        {
          stockQuantity: { lte: 0 }
        },
        {
          AND: [
            { stockQuantity: { gt: 0 } },
            { stockQuantity: { lte: prisma.item.fields.minStock } }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      minStock: true,
      unitPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { stockQuantity: 'asc' },
      { name: 'asc' }
    ]
  })

  // Categorize by urgency
  const outOfStock = lowStockItems.filter(item => item.stockQuantity <= 0)
  const criticallyLow = lowStockItems.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.minStock * 0.5)
  const low = lowStockItems.filter(item => item.stockQuantity > item.minStock * 0.5 && item.stockQuantity <= item.minStock)

  // Calculate reorder suggestions
  const reorderSuggestions = lowStockItems.map(item => {
    const suggestedOrderQuantity = Math.max(item.minStock * 2, 10) // Order enough for 2x minimum stock or at least 10 units
    const estimatedCost = suggestedOrderQuantity * Number(item.unitPrice) * 0.7 // Assume 70% of selling price as cost
    
    return {
      ...item,
      urgencyLevel: item.stockQuantity <= 0 ? 'OUT_OF_STOCK' : 
                   item.stockQuantity <= item.minStock * 0.5 ? 'CRITICAL' : 'LOW',
      suggestedOrderQuantity,
      estimatedCost,
      daysUntilStockOut: item.stockQuantity <= 0 ? 0 : Math.ceil(item.stockQuantity / Math.max(1, item.minStock / 30)), // Rough estimate
    }
  })

  const report = {
    summary: {
      totalLowStockItems: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      criticallyLowCount: criticallyLow.length,
      lowStockCount: low.length,
      totalEstimatedReorderCost: reorderSuggestions.reduce((sum, item) => sum + item.estimatedCost, 0),
    },
    breakdown: {
      outOfStock: outOfStock.map(item => ({
        ...item,
        urgencyLevel: 'OUT_OF_STOCK',
        category: item.category?.name || 'Uncategorized',
      })),
      criticallyLow: criticallyLow.map(item => ({
        ...item,
        urgencyLevel: 'CRITICAL',
        category: item.category?.name || 'Uncategorized',
      })),
      low: low.map(item => ({
        ...item,
        urgencyLevel: 'LOW',
        category: item.category?.name || 'Uncategorized',
      })),
    },
    reorderSuggestions: reorderSuggestions.slice(0, 30), // Top 30 most urgent
  }

  return NextResponse.json(report)
}

async function generateInventoryTurnoverReport(dateFrom: Date, dateTo: Date) {
  // Get items with their average inventory and sales
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      isService: false,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      costPrice: true,
      unitPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  // Get sales data for each item in the period
  const salesData = await prisma.transactionItem.groupBy({
    by: ['itemId'],
    where: {
      transaction: {
        type: 'SALE',
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    },
    _sum: {
      quantity: true,
      totalAmount: true,
    },
    _count: true,
  })

  // Calculate turnover metrics
  const turnoverAnalysis = items.map(item => {
    const sales = salesData.find(s => s.itemId === item.id)
    const quantitySold = sales?._sum.quantity || 0
    const salesValue = sales?._sum.totalAmount || 0
    const salesCount = sales?._count || 0
    
    const averageInventory = item.stockQuantity // Simplified - in reality, you'd want average over the period
    const costOfGoodsSold = quantitySold * Number(item.costPrice || item.unitPrice)
    
    // Inventory turnover ratio = Cost of Goods Sold / Average Inventory Value
    const averageInventoryValue = averageInventory * Number(item.costPrice || item.unitPrice)
    const turnoverRatio = averageInventoryValue > 0 ? costOfGoodsSold / averageInventoryValue : 0
    
    // Days in inventory = 365 / Turnover Ratio
    const daysInInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 365
    
    return {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      category: item.category?.name || 'Uncategorized',
      currentStock: item.stockQuantity,
      quantitySold,
      salesValue: Number(salesValue),
      salesCount,
      costPrice: Number(item.costPrice || item.unitPrice),
      averageInventoryValue,
      costOfGoodsSold,
      turnoverRatio,
      daysInInventory,
      turnoverCategory: turnoverRatio > 12 ? 'FAST_MOVING' : 
                      turnoverRatio > 4 ? 'MEDIUM_MOVING' : 
                      turnoverRatio > 0 ? 'SLOW_MOVING' : 'NO_MOVEMENT',
    }
  })

  // Sort by turnover ratio descending
  turnoverAnalysis.sort((a, b) => b.turnoverRatio - a.turnoverRatio)

  // Categorize items
  const fastMoving = turnoverAnalysis.filter(item => item.turnoverRatio > 12)
  const mediumMoving = turnoverAnalysis.filter(item => item.turnoverRatio > 4 && item.turnoverRatio <= 12)
  const slowMoving = turnoverAnalysis.filter(item => item.turnoverRatio > 0 && item.turnoverRatio <= 4)
  const noMovement = turnoverAnalysis.filter(item => item.turnoverRatio === 0)

  const report = {
    period: {
      from: dateFrom,
      to: dateTo,
    },
    summary: {
      totalItems: items.length,
      averageTurnoverRatio: turnoverAnalysis.reduce((sum, item) => sum + item.turnoverRatio, 0) / items.length,
      averageDaysInInventory: turnoverAnalysis.reduce((sum, item) => sum + item.daysInInventory, 0) / items.length,
      fastMovingCount: fastMoving.length,
      mediumMovingCount: mediumMoving.length,
      slowMovingCount: slowMoving.length,
      noMovementCount: noMovement.length,
    },
    categories: {
      fastMoving: fastMoving.slice(0, 20),
      mediumMoving: mediumMoving.slice(0, 20),
      slowMoving: slowMoving.slice(0, 20),
      noMovement: noMovement.slice(0, 20),
    },
    topPerformers: turnoverAnalysis.slice(0, 20),
    poorPerformers: turnoverAnalysis.slice(-20).reverse(),
  }

  return NextResponse.json(report)
}
