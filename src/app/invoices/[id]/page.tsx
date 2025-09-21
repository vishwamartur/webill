'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Send, Edit, Trash2, CheckCircle, Clock, AlertCircle, Printer } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Invoice {
  id: string
  invoiceNo: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  transaction?: {
    id: string
    transactionNo: string
  }
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentTerms?: string
  paymentTermsDays?: number
  notes?: string
  termsConditions?: string
  template: string
  currency: string
  billingAddress?: string
  shippingAddress?: string
  poNumber?: string
  reference?: string
  items: Array<{
    id: string
    item: {
      name: string
      sku?: string
    }
    quantity: number
    unitPrice: number
    discount: number
    taxRate: number
    totalAmount: number
  }>
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    paymentMethod: string
  }>
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string)
    }
  }, [params.id])

  const fetchInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        console.error('Invoice not found')
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'SENT': return <Send className="h-4 w-4 text-blue-600" />
      case 'DRAFT': return <Edit className="h-4 w-4 text-gray-600" />
      case 'OVERDUE': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const exportToPDF = async () => {
    if (!invoiceRef.current || !invoice) return

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${invoice.invoiceNo}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  const updateInvoiceStatus = async (status: string) => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoice(updatedInvoice)
      } else {
        console.error('Failed to update invoice status')
      }
    } catch (error) {
      console.error('Error updating invoice status:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Invoice Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoice Not Found">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Invoice not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={`Invoice ${invoice.invoiceNo}`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {invoice.status === 'DRAFT' && (
              <Button onClick={() => updateInvoiceStatus('SENT')}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            )}
            {invoice.status === 'SENT' && (
              <Button onClick={() => updateInvoiceStatus('PAID')} variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="bg-white">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                  <div className="text-lg font-semibold text-gray-700">{invoice.invoiceNo}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 mb-2">WeBill</div>
                  <div className="text-sm text-gray-600">
                    <div>Your Company Address</div>
                    <div>City, State, ZIP</div>
                    <div>Phone: (555) 123-4567</div>
                    <div>Email: info@webill.com</div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(invoice.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>Issue Date: {formatDate(invoice.issueDate)}</div>
                  <div>Due Date: {formatDate(invoice.dueDate)}</div>
                </div>
              </div>

              {/* Customer and Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                  <div className="text-gray-700">
                    <div className="font-semibold">{invoice.customer.name}</div>
                    {invoice.customer.email && <div>{invoice.customer.email}</div>}
                    {invoice.customer.phone && <div>{invoice.customer.phone}</div>}
                    {invoice.billingAddress && (
                      <div className="mt-2 whitespace-pre-line">{invoice.billingAddress}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
                  <div className="text-gray-700 space-y-1">
                    {invoice.poNumber && <div><span className="font-medium">PO Number:</span> {invoice.poNumber}</div>}
                    {invoice.reference && <div><span className="font-medium">Reference:</span> {invoice.reference}</div>}
                    {invoice.paymentTerms && <div><span className="font-medium">Payment Terms:</span> {invoice.paymentTerms}</div>}
                    <div><span className="font-medium">Currency:</span> {invoice.currency}</div>
                    {invoice.transaction && (
                      <div><span className="font-medium">Transaction:</span> {invoice.transaction.transactionNo}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Description</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">Qty</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Unit Price</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Discount</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Tax</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 px-2">
                          <div className="font-medium">{item.item.name}</div>
                          {item.item.sku && (
                            <div className="text-sm text-gray-500">SKU: {item.item.sku}</div>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">{item.quantity}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-3 px-2">
                          {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                        </td>
                        <td className="text-right py-3 px-2">{item.taxRate}%</td>
                        <td className="text-right py-3 px-2 font-medium">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(invoice.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                    </div>
                    {invoice.paidAmount > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Paid:</span>
                          <span>-{formatCurrency(invoice.paidAmount)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-lg font-semibold text-orange-600">
                            <span>Balance Due:</span>
                            <span>{formatCurrency(invoice.balanceAmount)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {invoice.payments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {invoice.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div>
                          <span className="font-medium">{formatDate(payment.paymentDate)}</span>
                          <span className="text-gray-500 ml-2">({payment.paymentMethod})</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes and Terms */}
              <div className="space-y-6">
                {invoice.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                    <div className="text-gray-700 whitespace-pre-line">{invoice.notes}</div>
                  </div>
                )}
                
                {invoice.termsConditions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                    <div className="text-gray-700 text-sm whitespace-pre-line">{invoice.termsConditions}</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-8 border-t text-center text-gray-500 text-sm">
                <div>Thank you for your business!</div>
                <div className="mt-2">This invoice was generated on {formatDate(new Date())}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
