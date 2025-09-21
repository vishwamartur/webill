/*
  Warnings:

  - The `gstTreatment` column on the `invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `cgstRate` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstRate` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstRate` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessRate` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgstAmount` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstAmount` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstAmount` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessAmount` on table `invoice_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgstAmount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstAmount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstAmount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessAmount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reverseCharge` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gstRate` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgstRate` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstRate` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstRate` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessRate` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgstAmount` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstAmount` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstAmount` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessAmount` on table `transaction_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgstAmount` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sgstAmount` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `igstAmount` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cessAmount` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reverseCharge` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."GstTreatment" AS ENUM ('REGULAR', 'COMPOSITION', 'EXEMPT', 'NIL_RATED', 'NON_GST');

-- DropIndex
DROP INDEX "public"."idx_invoices_place_of_supply";

-- DropIndex
DROP INDEX "public"."idx_items_hsn_code";

-- DropIndex
DROP INDEX "public"."idx_items_sac_code";

-- DropIndex
DROP INDEX "public"."idx_parties_gst_number";

-- DropIndex
DROP INDEX "public"."idx_parties_pan_number";

-- DropIndex
DROP INDEX "public"."idx_transactions_place_of_supply";

-- AlterTable
ALTER TABLE "public"."invoice_items" ALTER COLUMN "cgstRate" SET NOT NULL,
ALTER COLUMN "sgstRate" SET NOT NULL,
ALTER COLUMN "igstRate" SET NOT NULL,
ALTER COLUMN "cessRate" SET NOT NULL,
ALTER COLUMN "cgstAmount" SET NOT NULL,
ALTER COLUMN "sgstAmount" SET NOT NULL,
ALTER COLUMN "igstAmount" SET NOT NULL,
ALTER COLUMN "cessAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."invoices" ALTER COLUMN "currency" SET DEFAULT 'INR',
ALTER COLUMN "cgstAmount" SET NOT NULL,
ALTER COLUMN "sgstAmount" SET NOT NULL,
ALTER COLUMN "igstAmount" SET NOT NULL,
ALTER COLUMN "cessAmount" SET NOT NULL,
ALTER COLUMN "reverseCharge" SET NOT NULL,
DROP COLUMN "gstTreatment",
ADD COLUMN     "gstTreatment" "public"."GstTreatment" NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "public"."items" ALTER COLUMN "gstRate" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."parties" ALTER COLUMN "country" SET DEFAULT 'India';

-- AlterTable
ALTER TABLE "public"."transaction_items" ALTER COLUMN "cgstRate" SET NOT NULL,
ALTER COLUMN "sgstRate" SET NOT NULL,
ALTER COLUMN "igstRate" SET NOT NULL,
ALTER COLUMN "cessRate" SET NOT NULL,
ALTER COLUMN "cgstAmount" SET NOT NULL,
ALTER COLUMN "sgstAmount" SET NOT NULL,
ALTER COLUMN "igstAmount" SET NOT NULL,
ALTER COLUMN "cessAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."transactions" ALTER COLUMN "cgstAmount" SET NOT NULL,
ALTER COLUMN "sgstAmount" SET NOT NULL,
ALTER COLUMN "igstAmount" SET NOT NULL,
ALTER COLUMN "cessAmount" SET NOT NULL,
ALTER COLUMN "reverseCharge" SET NOT NULL;
