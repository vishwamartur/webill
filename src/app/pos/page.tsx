'use client'

import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  Barcode,
  Grid3X3,
  List,
  Calculator,
  Printer,
  BarChart3,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  sku?: string
  unitPrice: number
  quantity: number
  taxRate: number
  discount: number
  totalAmount: number
  stockQuantity: number
}

interface Item {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  unitPrice: number
  stockQuantity: number
  taxRate: number
  isActive: boolean
  isService: boolean
  category?: {
    name: string
  }
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

export default function POSPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH')
  const [receivedAmount, setReceivedAmount] = useState<string>('')
  const [showPayment, setShowPayment] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchItems()
    fetchCustomers()
  }, [])

  useEffect(() => {
    // Focus on barcode input for quick scanning
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?active=true')
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/parties?type=CUSTOMER&active=true')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.parties || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.phone && customer.phone.includes(customerSearch))
  )

  const addToCart = (item: Item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    
    if (existingItem) {
      if (existingItem.quantity < item.stockQuantity || item.isService) {
        updateCartItemQuantity(item.id, existingItem.quantity + 1)
      } else {
        alert('Insufficient stock')
      }
    } else {
      if (item.stockQuantity > 0 || item.isService) {
        const cartItem: CartItem = {
          id: item.id,
          name: item.name,
          sku: item.sku,
          unitPrice: parseFloat(item.unitPrice.toString()),
          quantity: 1,
          taxRate: parseFloat(item.taxRate.toString()),
          discount: 0,
          totalAmount: parseFloat(item.unitPrice.toString()),
          stockQuantity: item.stockQuantity,
        }
        setCart([...cart, cartItem])
      } else {
        alert('Item out of stock')
      }
    }
  }

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unitPrice * newQuantity - item.discount
        const taxAmount = (subtotal * item.taxRate) / 100
        const totalAmount = subtotal + taxAmount
        
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: totalAmount,
        }
      }
      return item
    }))
  }

  const updateCartItemDiscount = (itemId: string, discount: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unitPrice * item.quantity - discount
        const taxAmount = (subtotal * item.taxRate) / 100
        const totalAmount = subtotal + taxAmount
        
        return {
          ...item,
          discount: discount,
          totalAmount: totalAmount,
        }
      }
      return item
    }))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setReceivedAmount('')
    setShowPayment(false)
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
    const taxAmount = cart.reduce((sum, item) => {
      const itemSubtotal = item.unitPrice * item.quantity - item.discount
      return sum + (itemSubtotal * item.taxRate) / 100
    }, 0)
    const total = subtotal - totalDiscount + taxAmount

    return {
      subtotal,
      totalDiscount,
      taxAmount,
      total,
    }
  }

  const handleBarcodeSearch = (barcode: string) => {
    const item = items.find(item => 
      item.barcode === barcode || 
      item.sku === barcode
    )
    
    if (item) {
      addToCart(item)
      setSearchQuery('')
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = ''
      }
    } else {
      alert('Item not found')
    }
  }

  const processPayment = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }

    const totals = calculateTotals()
    const receivedAmountNum = parseFloat(receivedAmount) || 0

    if (paymentMethod === 'CASH' && receivedAmountNum < totals.total) {
      alert('Insufficient payment amount')
      return
    }

    setProcessing(true)

    try {
      // Create transaction
      const transactionData = {
        type: 'SALE',
        customerId: selectedCustomer.id,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.totalDiscount,
        totalAmount: totals.total,
        paymentStatus: 'COMPLETED',
        paymentMethod: paymentMethod,
        notes: `POS Sale - ${new Date().toLocaleString()}`,
        items: cart.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          totalAmount: item.totalAmount,
        })),
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (response.ok) {
        const transaction = await response.json()
        
        // Print receipt
        printReceipt(transaction, totals, receivedAmountNum)
        
        // Clear cart
        clearCart()
        
        // Refresh items to update stock
        fetchItems()
        
        alert('Sale completed successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment')
    } finally {
      setProcessing(false)
    }
  }

  const printReceipt = (transaction: any, totals: any, receivedAmount: number) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transaction.transactionNo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>WeBill POS</h2>
            <p>Receipt #${transaction.transactionNo}</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          
          <div class="line"></div>
          
          <p><strong>Customer:</strong> ${selectedCustomer?.name}</p>
          ${selectedCustomer?.phone ? `<p><strong>Phone:</strong> ${selectedCustomer.phone}</p>` : ''}
          
          <div class="line"></div>
          
          ${cart.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>${formatCurrency(item.totalAmount)}</span>
            </div>
          `).join('')}
          
          <div class="line"></div>
          
          <div class="item">
            <span>Subtotal:</span>
            <span>${formatCurrency(totals.subtotal)}</span>
          </div>
          
          ${totals.totalDiscount > 0 ? `
            <div class="item">
              <span>Discount:</span>
              <span>-${formatCurrency(totals.totalDiscount)}</span>
            </div>
          ` : ''}
          
          <div class="item">
            <span>Tax:</span>
            <span>${formatCurrency(totals.taxAmount)}</span>
          </div>
          
          <div class="item total">
            <span>Total:</span>
            <span>${formatCurrency(totals.total)}</span>
          </div>
          
          <div class="line"></div>
          
          <div class="item">
            <span>Payment Method:</span>
            <span>${paymentMethod}</span>
          </div>
          
          ${paymentMethod === 'CASH' ? `
            <div class="item">
              <span>Received:</span>
              <span>${formatCurrency(receivedAmount)}</span>
            </div>
            <div class="item">
              <span>Change:</span>
              <span>${formatCurrency(receivedAmount - totals.total)}</span>
            </div>
          ` : ''}
          
          <div class="line"></div>
          
          <div class="header">
            <p>Thank you for your business!</p>
          </div>
          
          <script>
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <AppLayout title="Point of Sale">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading POS...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Point of Sale">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/pos/reports')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button variant="outline" onClick={() => router.push('/pos/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={barcodeInputRef}
                placeholder="Search products or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    handleBarcodeSearch(searchQuery)
                  }
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-4">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.sku && `SKU: ${item.sku}`}
                      </div>
                      <div className="text-lg font-bold text-blue-600 mt-2">
                        {formatCurrency(item.unitPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.isService ? 'Service' : `Stock: ${item.stockQuantity}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.sku && `SKU: ${item.sku}`}
                            {item.category && ` • ${item.category.name}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.isService ? 'Service' : `Stock: ${item.stockQuantity}`}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customerSearch && (
                  <div className="max-h-32 overflow-y-auto border rounded">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setCustomerSearch('')
                        }}
                      >
                        <div className="font-medium">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="p-2 bg-blue-50 rounded border">
                    <div className="font-medium">{selectedCustomer.name}</div>
                    {selectedCustomer.phone && (
                      <div className="text-sm text-gray-500">{selectedCustomer.phone}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart ({cart.length})
                </div>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <div>Cart is empty</div>
                  <div className="text-sm">Add items to get started</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals and Payment */}
          {cart.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>

                {!showPayment ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowPayment(true)}
                    disabled={!selectedCustomer}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(['CASH', 'CARD', 'UPI'] as const).map((method) => (
                        <Button
                          key={method}
                          variant={paymentMethod === method ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPaymentMethod(method)}
                        >
                          {method === 'CASH' && <DollarSign className="h-4 w-4 mr-1" />}
                          {method === 'CARD' && <CreditCard className="h-4 w-4 mr-1" />}
                          {method}
                        </Button>
                      ))}
                    </div>

                    {paymentMethod === 'CASH' && (
                      <div>
                        <Input
                          type="number"
                          placeholder="Amount received"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          step="0.01"
                        />
                        {receivedAmount && parseFloat(receivedAmount) >= totals.total && (
                          <div className="text-sm text-green-600 mt-1">
                            Change: {formatCurrency(parseFloat(receivedAmount) - totals.total)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPayment(false)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={processPayment}
                        disabled={processing}
                        className="flex-1"
                      >
                        {processing ? (
                          'Processing...'
                        ) : (
                          <>
                            <Receipt className="h-4 w-4 mr-2" />
                            Complete Sale
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
