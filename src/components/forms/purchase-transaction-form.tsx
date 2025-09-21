'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Search } from 'lucide-react'

interface Party {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Item {
  id: string
  name: string
  sku?: string
  unitPrice: number
  costPrice?: number
  stockQuantity: number
  taxRate: number
  isService: boolean
}

interface TransactionItem {
  itemId: string
  item?: Item
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  totalAmount: number
}

interface PurchaseTransactionFormData {
  supplierId: string
  date: string
  items: TransactionItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paymentStatus: 'PENDING' | 'COMPLETED'
  paymentMethod?: string
  notes?: string
}

interface PurchaseTransactionFormProps {
  initialData?: Partial<PurchaseTransactionFormData>
  onSubmit: (data: PurchaseTransactionFormData & { type: 'PURCHASE' }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function PurchaseTransactionForm({ initialData, onSubmit, onCancel, isLoading }: PurchaseTransactionFormProps) {
  const [suppliers, setSuppliers] = useState<Party[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [formData, setFormData] = useState<PurchaseTransactionFormData>({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    paymentStatus: 'PENDING',
    paymentMethod: '',
    notes: '',
    ...initialData,
  })

  useEffect(() => {
    fetchSuppliers()
    fetchItems()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discountAmount])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/parties?type=SUPPLIER')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.parties || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalAmount, 0)
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice - item.discount
      return sum + (itemSubtotal * item.taxRate / 100)
    }, 0)
    const totalAmount = subtotal + taxAmount - formData.discountAmount

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount: Math.max(0, totalAmount),
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
        totalAmount: 0,
      }],
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      const item = { ...newItems[index] }
      
      if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value)
        if (selectedItem) {
          item.item = selectedItem
          // Use cost price for purchases if available, otherwise use unit price
          item.unitPrice = selectedItem.costPrice || selectedItem.unitPrice
          item.taxRate = selectedItem.taxRate
        }
      }
      
      item[field] = value as never
      
      // Recalculate item total
      const itemSubtotal = item.quantity * item.unitPrice - item.discount
      item.totalAmount = itemSubtotal + (itemSubtotal * item.taxRate / 100)
      
      newItems[index] = item
      return { ...prev, items: newItems }
    })
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ ...formData, type: 'PURCHASE' })
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>New Purchase Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedSupplier?.name || supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value)
                    setShowSupplierDropdown(true)
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, supplierId: '' }))
                    }
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search supplier..."
                  required
                />
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, supplierId: supplier.id }))
                          setSupplierSearch('')
                          setShowSupplierDropdown(false)
                        }}
                      >
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.email && (
                          <div className="text-sm text-gray-500">{supplier.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Items to Purchase</h3>
              <Button type="button" onClick={addItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item
                        </label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Item</option>
                          {items.map((availableItem) => (
                            <option key={availableItem.id} value={availableItem.id}>
                              {availableItem.name} {availableItem.sku && `(${availableItem.sku})`}
                            </option>
                          ))}
                        </select>
                        {item.item && (
                          <div className="text-xs text-gray-500 mt-1">
                            Current Stock: {item.item.stockQuantity}
                            {item.item.costPrice && (
                              <span className="ml-2">Cost: ${item.item.costPrice.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Cost
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Total</div>
                          <div className="text-lg font-semibold">${item.totalAmount.toFixed(2)}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment and Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Payment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {formData.paymentStatus === 'COMPLETED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Method</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                      <option value="WALLET">Wallet</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Purchase order notes, delivery instructions, etc."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${formData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${formData.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${formData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.items.length === 0}>
              {isLoading ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
