import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { reminderType = 'payment', customMessage } = await request.json()

    // Get the invoice with customer details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot send reminder for paid or cancelled invoices' },
        { status: 400 }
      )
    }

    if (!invoice.customer.email) {
      return NextResponse.json(
        { error: 'Customer email is required to send reminders' },
        { status: 400 }
      )
    }

    // Update invoice reminder tracking
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        remindersSent: invoice.remindersSent + 1,
        lastReminderDate: new Date(),
        // Update status to OVERDUE if past due date
        status: new Date() > new Date(invoice.dueDate) && invoice.status === 'SENT' 
          ? 'OVERDUE' 
          : invoice.status,
      },
    })

    // Generate reminder message based on type
    let subject = ''
    let message = ''
    
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = daysOverdue > 0

    switch (reminderType) {
      case 'payment':
        subject = isOverdue 
          ? `Overdue Payment Reminder - Invoice ${invoice.invoiceNo}`
          : `Payment Reminder - Invoice ${invoice.invoiceNo}`
        
        message = customMessage || (isOverdue
          ? `Dear ${invoice.customer.name},\n\nThis is a reminder that your payment for Invoice ${invoice.invoiceNo} is now ${daysOverdue} days overdue. The original due date was ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nAmount Due: $${invoice.balanceAmount.toFixed(2)}\n\nPlease arrange payment at your earliest convenience to avoid any late fees.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nWeBill Team`
          : `Dear ${invoice.customer.name},\n\nThis is a friendly reminder that payment for Invoice ${invoice.invoiceNo} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nAmount Due: $${invoice.balanceAmount.toFixed(2)}\n\nPlease ensure payment is made by the due date to avoid any late fees.\n\nThank you for your business.\n\nBest regards,\nWeBill Team`)
        break

      case 'final_notice':
        subject = `Final Notice - Invoice ${invoice.invoiceNo}`
        message = customMessage || `Dear ${invoice.customer.name},\n\nThis is a FINAL NOTICE for Invoice ${invoice.invoiceNo}, which is now ${daysOverdue} days overdue.\n\nAmount Due: $${invoice.balanceAmount.toFixed(2)}\nOriginal Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nImmediate payment is required to avoid further collection actions. Please contact us immediately if you have any questions or concerns.\n\nThank you for your immediate attention.\n\nBest regards,\nWeBill Team`
        break

      case 'thank_you':
        subject = `Thank You - Payment Received for Invoice ${invoice.invoiceNo}`
        message = customMessage || `Dear ${invoice.customer.name},\n\nThank you for your payment of $${invoice.paidAmount.toFixed(2)} for Invoice ${invoice.invoiceNo}.\n\nWe appreciate your prompt payment and continued business.\n\nBest regards,\nWeBill Team`
        break

      default:
        subject = `Invoice ${invoice.invoiceNo} - ${reminderType}`
        message = customMessage || `Dear ${invoice.customer.name},\n\nRegarding Invoice ${invoice.invoiceNo}.\n\nAmount Due: $${invoice.balanceAmount.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nBest regards,\nWeBill Team`
    }

    // In a real application, you would integrate with an email service here
    // For now, we'll simulate sending the email
    const reminderData = {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerEmail: invoice.customer.email,
      customerName: invoice.customer.name,
      reminderType,
      subject,
      message,
      sentAt: new Date(),
      reminderCount: updatedInvoice.remindersSent,
    }

    // Log the reminder (in a real app, you might want to store this in a separate table)
    console.log('Reminder sent:', reminderData)

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      reminderData,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Error sending invoice reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}

// Get reminder history for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNo: true,
        remindersSent: true,
        lastReminderDate: true,
        status: true,
        dueDate: true,
        balanceAmount: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    const daysOverdue = today > dueDate ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const daysUntilDue = today < dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0

    const reminderInfo = {
      invoice,
      reminderStats: {
        totalRemindersSent: invoice.remindersSent,
        lastReminderDate: invoice.lastReminderDate,
        daysOverdue,
        daysUntilDue,
        isOverdue: daysOverdue > 0,
        canSendReminder: invoice.status !== 'PAID' && invoice.status !== 'CANCELLED',
        suggestedReminderType: daysOverdue > 30 ? 'final_notice' : daysOverdue > 0 ? 'payment' : 'payment',
      },
    }

    return NextResponse.json(reminderInfo)
  } catch (error) {
    console.error('Error fetching reminder info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder info' },
      { status: 500 }
    )
  }
}
