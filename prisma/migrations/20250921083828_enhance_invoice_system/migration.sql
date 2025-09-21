-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastReminderDate" TIMESTAMP(3),
ADD COLUMN     "nextInvoiceDate" TIMESTAMP(3),
ADD COLUMN     "paymentTermsDays" INTEGER,
ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "recurringPeriod" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "remindersSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentDate" TIMESTAMP(3),
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "template" TEXT NOT NULL DEFAULT 'modern',
ADD COLUMN     "transactionId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
