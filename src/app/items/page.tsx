'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Package, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react'

interface Item {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  unitPrice: number
  costPrice?: number
  stockQuantity: number
  minStock: number
  unit: string
  taxRate: number
  isActive: boolean
  isService: boolean
  createdAt: string
  updatedAt: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'SERVICE' && item.isService) ||
                         (filterType === 'PRODUCT' && !item.isService)
    return matchesSearch && matchesFilter
  })

  const isLowStock = (item: Item) => {
    return !item.isService && item.stockQuantity <= item.minStock
  }

  if (loading) {
    return (
      <AppLayout title="Items Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Items Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Items</option>
              <option value="PRODUCT">Products</option>
              <option value="SERVICE">Services</option>
            </select>
          </div>
          <Link href="/items/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </Link>
        </div>

        {/* Items Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className={isLowStock(item) ? 'border-orange-200 bg-orange-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    {item.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {isLowStock(item) && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isService 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.isService ? 'Service' : 'Product'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {item.sku && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">SKU:</span>
                      <span>{item.sku}</span>
                    </div>
                  )}
                  {item.category && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">Category:</span>
                      <span>{item.category.name}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="font-medium w-20">Price:</span>
                    <span className="font-semibold text-green-600">${item.unitPrice.toFixed(2)}</span>
                  </div>
                  {!item.isService && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">Stock:</span>
                      <span className={isLowStock(item) ? 'text-orange-600 font-semibold' : ''}>
                        {item.stockQuantity} {item.unit}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="font-medium w-20">Tax:</span>
                    <span>{item.taxRate}%</span>
                  </div>
                  {item.description && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg">No items found</div>
            <div className="text-gray-400 text-sm mt-2">
              {searchTerm || filterType !== 'ALL' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first item'
              }
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
