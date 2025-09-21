'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  Barcode, 
  User, 
  Receipt,
  Settings,
  BarChart3,
  Keyboard,
  HelpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function POSHelpPage() {
  const router = useRouter()

  return (
    <AppLayout title="POS Help & Documentation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Select a Customer</h4>
                <p className="text-sm text-gray-600">
                  Use the customer search field to find and select a customer for the transaction. 
                  You can search by name or phone number.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Add Products to Cart</h4>
                <p className="text-sm text-gray-600">
                  Click on products to add them to the cart, or use the barcode scanner 
                  to quickly add items by scanning their barcodes.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. Review and Adjust</h4>
                <p className="text-sm text-gray-600">
                  Review the cart items, adjust quantities, apply discounts, 
                  and verify the total amount before proceeding to payment.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">4. Process Payment</h4>
                <p className="text-sm text-gray-600">
                  Choose the payment method (Cash, Card, or UPI), enter the received amount 
                  if paying with cash, and complete the sale.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Product Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Search Products</h4>
                <p className="text-sm text-gray-600">
                  Use the search bar to find products by name, SKU, or barcode. 
                  The search is real-time and case-insensitive.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">View Modes</h4>
                <p className="text-sm text-gray-600">
                  Switch between grid and list view modes using the view toggle buttons. 
                  Grid view shows more products at once, while list view shows more details.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Stock Information</h4>
                <p className="text-sm text-gray-600">
                  Each product shows its current stock level. Out-of-stock items 
                  cannot be added to the cart unless they are marked as services.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Pricing</h4>
                <p className="text-sm text-gray-600">
                  Product prices are displayed prominently. Tax calculations 
                  are applied automatically based on the item's tax rate.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Scanning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Barcode className="h-5 w-5 mr-2" />
                Barcode Scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Quick Scanning</h4>
                <p className="text-sm text-gray-600">
                  The search field doubles as a barcode input. Simply scan or type 
                  a barcode and press Enter to add the item to the cart.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Supported Formats</h4>
                <p className="text-sm text-gray-600">
                  The system supports both barcode and SKU scanning. Make sure 
                  your products have barcodes or SKUs configured in the inventory.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Auto-focus</h4>
                <p className="text-sm text-gray-600">
                  The barcode input field automatically maintains focus for 
                  continuous scanning without clicking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Payment Methods</h4>
                <p className="text-sm text-gray-600">
                  Accept payments via Cash, Card, or UPI. Each method has 
                  different processing requirements and receipt formats.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Cash Payments</h4>
                <p className="text-sm text-gray-600">
                  For cash payments, enter the amount received to automatically 
                  calculate change. The system prevents completing sales with insufficient payment.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Card & UPI</h4>
                <p className="text-sm text-gray-600">
                  Card and UPI payments are processed at the exact total amount. 
                  No change calculation is needed for these payment methods.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Transaction Records</h4>
                <p className="text-sm text-gray-600">
                  All completed sales are automatically recorded as transactions 
                  and can be viewed in the sales management section.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Customer Search</h4>
                <p className="text-sm text-gray-600">
                  Search for customers by name or phone number. The search 
                  shows matching results in real-time as you type.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Walk-in Customers</h4>
                <p className="text-sm text-gray-600">
                  For walk-in customers, you can create a generic "Walk-in Customer" 
                  entry or process sales without selecting a specific customer.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <p className="text-sm text-gray-600">
                  Selected customer information is displayed in the cart section, 
                  including name and contact details for receipt generation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Receipt & Printing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Receipt & Printing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Automatic Receipts</h4>
                <p className="text-sm text-gray-600">
                  Receipts are automatically generated for each completed sale 
                  and can be printed or saved as PDF.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Receipt Content</h4>
                <p className="text-sm text-gray-600">
                  Receipts include transaction details, itemized list, tax breakdown, 
                  payment information, and change calculation for cash payments.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Print Options</h4>
                <p className="text-sm text-gray-600">
                  Use the browser's print function or configure automatic printing 
                  in the POS settings for streamlined operations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reports & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Daily Reports</h4>
                <p className="text-sm text-gray-600">
                  View daily sales reports including total sales, transaction count, 
                  payment method breakdown, and top-selling items.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Real-time Analytics</h4>
                <p className="text-sm text-gray-600">
                  Analytics are updated in real-time as sales are processed, 
                  providing immediate insights into business performance.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Export Options</h4>
                <p className="text-sm text-gray-600">
                  Export reports to CSV or print them for record-keeping 
                  and business analysis purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings & Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Receipt Settings</h4>
                <p className="text-sm text-gray-600">
                  Customize receipt header, footer, logo display, and automatic 
                  printing preferences in the POS settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Payment Configuration</h4>
                <p className="text-sm text-gray-600">
                  Set default payment methods, enable/disable partial payments, 
                  and configure customer selection requirements.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Display Options</h4>
                <p className="text-sm text-gray-600">
                  Configure items per page, default view mode, image display, 
                  and other interface preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Keyboard className="h-5 w-5 mr-2" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Search Products:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>New Sale:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Process Payment:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+P</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear Cart:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+C</kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Customer Search:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F2</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Payment:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F4</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Card Payment:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Complete Sale:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Shift+Enter</kbd>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
