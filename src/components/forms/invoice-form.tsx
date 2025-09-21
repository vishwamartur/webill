'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Search, FileText, Calendar } from 'lucide-react'

interface Party {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface Item {
  id: string
  name: string
  sku?: string
  unitPrice: number
  taxRate: number
  isService: boolean
}

interface Transaction {
  id: string
  transactionNo: string
  customer: Party
  items: Array<{
    item: Item
    quantity: number
    unitPrice: number
    discount: number
    taxRate: number
    totalAmount: number
  }>
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
}

interface InvoiceItem {
  itemId: string
  item?: Item
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  totalAmount: number
}

interface InvoiceFormData {
  customerId: string
  transactionId?: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentTerms: string
  paymentTermsDays: number
  notes?: string
  termsConditions?: string
  template: string
  currency: string
  placeOfSupply?: string
  reverseCharge: boolean
  gstTreatment: string
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  cessAmount: number
  billingAddress?: string
  shippingAddress?: string
  poNumber?: string
  reference?: string
  isRecurring: boolean
  recurringPeriod?: string
  nextInvoiceDate?: string
}

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>
  onSubmit: (data: InvoiceFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const paymentTermsOptions = [
  { value: 'Due on Receipt', days: 0 },
  { value: 'Net 15', days: 15 },
  { value: 'Net 30', days: 30 },
  { value: 'Net 45', days: 45 },
  { value: 'Net 60', days: 60 },
  { value: 'Net 90', days: 90 },
]

const templateOptions = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
]

export function InvoiceForm({ initialData, onSubmit, onCancel, isLoading }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Party[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
    transactionId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    paymentTerms: 'Net 30',
    paymentTermsDays: 30,
    notes: '',
    termsConditions: 'Payment is due within the specified period. Late payments may incur additional charges.',
    template: 'modern',
    currency: 'USD',
    billingAddress: '',
    shippingAddress: '',
    poNumber: '',
    reference: '',
    isRecurring: false,
    recurringPeriod: '',
    nextInvoiceDate: '',
    ...initialData,
  })

  useEffect(() => {
    fetchCustomers()
    fetchItems()
    fetchTransactions()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discountAmount])

  useEffect(() => {
    // Calculate due date when issue date or payment terms change
    if (formData.issueDate && formData.paymentTermsDays) {
      const issueDate = new Date(formData.issueDate)
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + formData.paymentTermsDays)
      setFormData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }))
    }
  }, [formData.issueDate, formData.paymentTermsDays])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/parties?type=CUSTOMER')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.parties || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?type=SALE')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalAmount, 0)
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice - item.discount
      return sum + (itemSubtotal * item.taxRate / 100)
    }, 0)
    const totalAmount = subtotal + taxAmount - formData.discountAmount
    const balanceAmount = totalAmount - formData.paidAmount

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount: Math.max(0, totalAmount),
      balanceAmount: Math.max(0, balanceAmount),
    }))
  }

  const loadFromTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setFormData(prev => ({
        ...prev,
        customerId: transaction.customer.id,
        transactionId: transaction.id,
        items: transaction.items.map(item => ({
          itemId: item.item.id,
          item: item.item,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          totalAmount: item.totalAmount,
        })),
        billingAddress: transaction.customer.address || '',
        shippingAddress: transaction.customer.address || '',
      }))
      setCustomerSearch('')
    }
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      const item = { ...newItems[index] }
      
      if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value)
        if (selectedItem) {
          item.item = selectedItem
          item.unitPrice = selectedItem.unitPrice
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const selectedCustomer = customers.find(c => c.id === formData.customerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          {initialData ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Load from Transaction */}
          {!initialData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import from Sales Transaction (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.transactionId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, transactionId: e.target.value }))
                    if (e.target.value) {
                      loadFromTransaction(e.target.value)
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a sales transaction to import</option>
                  {transactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.transactionNo} - {transaction.customer.name} - {transaction.totalAmount}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {/* Customer and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomer?.name || customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerDropdown(true)
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, customerId: '' }))
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search customer..."
                  required
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            customerId: customer.id,
                            billingAddress: customer.address || '',
                            shippingAddress: customer.address || '',
                          }))
                          setCustomerSearch('')
                          setShowCustomerDropdown(false)
                        }}
                      >
                        <div className="font-medium">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Payment Terms and Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => {
                  const selectedTerm = paymentTermsOptions.find(term => term.value === e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    paymentTerms: e.target.value,
                    paymentTermsDays: selectedTerm?.days || 30,
                  }))
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {paymentTermsOptions.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                value={formData.template}
                onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {templateOptions.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Reference Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Purchase Order Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Reference Number"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Invoice Items</h3>
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
                          Unit Price
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

          {/* Addresses and Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  value={formData.billingAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address
                </label>
                <textarea
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Invoice Summary</h3>
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
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-orange-600">
                      <span>Balance:</span>
                      <span>${formData.balanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recurring Invoice Options */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Recurring Invoice</span>
                </label>
                
                {formData.isRecurring && (
                  <div className="mt-2 space-y-2">
                    <select
                      value={formData.recurringPeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringPeriod: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Period</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    
                    <input
                      type="date"
                      value={formData.nextInvoiceDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextInvoiceDate: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Next Invoice Date"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              value={formData.termsConditions}
              onChange={(e) => setFormData(prev => ({ ...prev, termsConditions: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.items.length === 0}>
              {isLoading ? 'Saving...' : (initialData ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
