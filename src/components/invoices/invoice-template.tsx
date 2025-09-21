'use client'

import { forwardRef } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceTemplateProps {
  invoice: {
    invoiceNo: string
    issueDate: string
    dueDate: string
    status: string
    customer: {
      name: string
      email?: string
      phone?: string
    }
    subtotal: number
    taxAmount: number
    discountAmount: number
    totalAmount: number
    paidAmount: number
    balanceAmount: number
    paymentTerms?: string
    notes?: string
    termsConditions?: string
    template: string
    currency: string
    billingAddress?: string
    shippingAddress?: string
    poNumber?: string
    reference?: string
    items: Array<{
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
      amount: number
      paymentDate: string
      paymentMethod: string
    }>
  }
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
    website?: string
    logo?: string
  }
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, companyInfo }, ref) => {
    const company = companyInfo || {
      name: 'WeBill',
      address: 'Your Company Address\nCity, State, ZIP',
      phone: '(555) 123-4567',
      email: 'info@webill.com',
      website: 'www.webill.com',
    }

    const getTemplateStyles = () => {
      switch (invoice.template) {
        case 'classic':
          return {
            container: 'bg-white font-serif',
            header: 'border-b-4 border-gray-800 pb-6 mb-8',
            title: 'text-4xl font-bold text-gray-800 mb-2',
            companyName: 'text-3xl font-bold text-gray-800',
            sectionTitle: 'text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2',
            table: 'border-collapse border border-gray-400',
            tableHeader: 'bg-gray-100 border border-gray-400 px-4 py-3 font-bold',
            tableCell: 'border border-gray-400 px-4 py-3',
          }
        case 'minimal':
          return {
            container: 'bg-white font-light',
            header: 'pb-8 mb-8',
            title: 'text-3xl font-light text-gray-700 mb-2',
            companyName: 'text-2xl font-light text-gray-700',
            sectionTitle: 'text-lg font-light text-gray-700 mb-4',
            table: 'border-collapse',
            tableHeader: 'border-b border-gray-200 px-4 py-3 font-medium text-left',
            tableCell: 'border-b border-gray-100 px-4 py-3',
          }
        default: // modern
          return {
            container: 'bg-white font-sans',
            header: 'bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 mb-8 rounded-lg',
            title: 'text-4xl font-bold mb-2',
            companyName: 'text-3xl font-bold',
            sectionTitle: 'text-xl font-semibold text-gray-800 mb-4',
            table: 'border-collapse w-full',
            tableHeader: 'bg-blue-50 px-4 py-3 font-semibold text-left border-b-2 border-blue-200',
            tableCell: 'px-4 py-3 border-b border-gray-200',
          }
      }
    }

    const styles = getTemplateStyles()

    return (
      <div ref={ref} className={`${styles.container} max-w-4xl mx-auto p-8`}>
        {/* Header */}
        <div className={styles.header}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className={styles.title}>INVOICE</h1>
              <div className="text-xl font-semibold opacity-90">{invoice.invoiceNo}</div>
            </div>
            <div className="text-right">
              <div className={styles.companyName}>{company.name}</div>
              <div className="mt-2 opacity-90 whitespace-pre-line text-sm">
                {company.address}
              </div>
              <div className="mt-2 opacity-90 text-sm">
                <div>{company.phone}</div>
                <div>{company.email}</div>
                {company.website && <div>{company.website}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className={styles.sectionTitle}>Bill To:</h3>
            <div className="text-gray-700">
              <div className="font-semibold text-lg">{invoice.customer.name}</div>
              {invoice.customer.email && <div className="mt-1">{invoice.customer.email}</div>}
              {invoice.customer.phone && <div className="mt-1">{invoice.customer.phone}</div>}
              {invoice.billingAddress && (
                <div className="mt-2 whitespace-pre-line">{invoice.billingAddress}</div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionTitle}>Invoice Details:</h3>
            <div className="text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Issue Date:</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Due Date:</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.poNumber && (
                <div className="flex justify-between">
                  <span className="font-medium">PO Number:</span>
                  <span>{invoice.poNumber}</span>
                </div>
              )}
              {invoice.reference && (
                <div className="flex justify-between">
                  <span className="font-medium">Reference:</span>
                  <span>{invoice.reference}</span>
                </div>
              )}
              {invoice.paymentTerms && (
                <div className="flex justify-between">
                  <span className="font-medium">Payment Terms:</span>
                  <span>{invoice.paymentTerms}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Currency:</span>
                <span>{invoice.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h3 className={styles.sectionTitle}>Items:</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Description</th>
                <th className={styles.tableHeader}>Qty</th>
                <th className={styles.tableHeader}>Unit Price</th>
                <th className={styles.tableHeader}>Discount</th>
                <th className={styles.tableHeader}>Tax</th>
                <th className={styles.tableHeader}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className={styles.tableCell}>
                    <div className="font-medium">{item.item.name}</div>
                    {item.item.sku && (
                      <div className="text-sm text-gray-500">SKU: {item.item.sku}</div>
                    )}
                  </td>
                  <td className={`${styles.tableCell} text-center`}>{item.quantity}</td>
                  <td className={`${styles.tableCell} text-right`}>
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className={`${styles.tableCell} text-right`}>
                    {item.discount > 0 ? formatCurrency(item.discount, invoice.currency) : '-'}
                  </td>
                  <td className={`${styles.tableCell} text-center`}>{item.taxRate}%</td>
                  <td className={`${styles.tableCell} text-right font-medium`}>
                    {formatCurrency(item.totalAmount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              <div className="border-t-2 pt-3">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
              {invoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-600 text-lg">
                    <span>Paid:</span>
                    <span>-{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold text-orange-600">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.balanceAmount, invoice.currency)}</span>
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
            <h3 className={styles.sectionTitle}>Payment History:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{formatDate(payment.paymentDate)}</span>
                    <span className="text-gray-500 ml-2">({payment.paymentMethod})</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(payment.amount, invoice.currency)}
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
              <h3 className={styles.sectionTitle}>Notes:</h3>
              <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded">
                {invoice.notes}
              </div>
            </div>
          )}
          
          {invoice.termsConditions && (
            <div>
              <h3 className={styles.sectionTitle}>Terms & Conditions:</h3>
              <div className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-4 rounded">
                {invoice.termsConditions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-gray-500 text-sm">
          <div className="mb-2">Thank you for your business!</div>
          <div>This invoice was generated on {formatDate(new Date())}</div>
          {invoice.template === 'modern' && (
            <div className="mt-4 text-blue-600 font-medium">
              Powered by WeBill - Professional Billing Solution
            </div>
          )}
        </div>
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'
