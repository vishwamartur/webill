-- Add GST-related fields to parties table
ALTER TABLE "parties" ADD COLUMN "gstNumber" TEXT;
ALTER TABLE "parties" ADD COLUMN "panNumber" TEXT;
ALTER TABLE "parties" ADD COLUMN "stateCode" TEXT;
ALTER TABLE "parties" ADD COLUMN "placeOfSupply" TEXT;

-- Add HSN/SAC codes to items table
ALTER TABLE "items" ADD COLUMN "hsnCode" TEXT;
ALTER TABLE "items" ADD COLUMN "sacCode" TEXT;
ALTER TABLE "items" ADD COLUMN "gstRate" DECIMAL(5,2) DEFAULT 18.00;

-- Add GST breakdown fields to transactions table
ALTER TABLE "transactions" ADD COLUMN "cgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "sgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "igstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "cessAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "placeOfSupply" TEXT;
ALTER TABLE "transactions" ADD COLUMN "reverseCharge" BOOLEAN DEFAULT false;

-- Add GST breakdown fields to transaction_items table
ALTER TABLE "transaction_items" ADD COLUMN "cgstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "sgstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "igstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "cessRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "cgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "sgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "igstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "cessAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "transaction_items" ADD COLUMN "hsnCode" TEXT;
ALTER TABLE "transaction_items" ADD COLUMN "sacCode" TEXT;

-- Add GST breakdown fields to invoices table
ALTER TABLE "invoices" ADD COLUMN "cgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "sgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "igstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "cessAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "placeOfSupply" TEXT;
ALTER TABLE "invoices" ADD COLUMN "reverseCharge" BOOLEAN DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "gstTreatment" TEXT DEFAULT 'regular';

-- Add GST breakdown fields to invoice_items table
ALTER TABLE "invoice_items" ADD COLUMN "cgstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "sgstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "igstRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "cessRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "cgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "sgstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "igstAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "cessAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "hsnCode" TEXT;
ALTER TABLE "invoice_items" ADD COLUMN "sacCode" TEXT;

-- Update default currency from USD to INR
UPDATE "invoices" SET "currency" = 'INR' WHERE "currency" = 'USD';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_parties_gst_number" ON "parties"("gstNumber");
CREATE INDEX IF NOT EXISTS "idx_parties_pan_number" ON "parties"("panNumber");
CREATE INDEX IF NOT EXISTS "idx_items_hsn_code" ON "items"("hsnCode");
CREATE INDEX IF NOT EXISTS "idx_items_sac_code" ON "items"("sacCode");
CREATE INDEX IF NOT EXISTS "idx_transactions_place_of_supply" ON "transactions"("placeOfSupply");
CREATE INDEX IF NOT EXISTS "idx_invoices_place_of_supply" ON "invoices"("placeOfSupply");

-- Add comments for documentation
COMMENT ON COLUMN "parties"."gstNumber" IS 'GST Registration Number (GSTIN)';
COMMENT ON COLUMN "parties"."panNumber" IS 'Permanent Account Number (PAN)';
COMMENT ON COLUMN "parties"."stateCode" IS 'State code for GST (e.g., 27 for Maharashtra)';
COMMENT ON COLUMN "parties"."placeOfSupply" IS 'Place of supply for GST calculation';
COMMENT ON COLUMN "items"."hsnCode" IS 'Harmonized System of Nomenclature code for goods';
COMMENT ON COLUMN "items"."sacCode" IS 'Services Accounting Code for services';
COMMENT ON COLUMN "items"."gstRate" IS 'GST rate applicable to this item';
COMMENT ON COLUMN "transactions"."cgstAmount" IS 'Central GST amount';
COMMENT ON COLUMN "transactions"."sgstAmount" IS 'State GST amount';
COMMENT ON COLUMN "transactions"."igstAmount" IS 'Integrated GST amount';
COMMENT ON COLUMN "transactions"."cessAmount" IS 'Cess amount if applicable';
COMMENT ON COLUMN "transactions"."reverseCharge" IS 'Whether reverse charge mechanism applies';
COMMENT ON COLUMN "invoices"."gstTreatment" IS 'GST treatment type: regular, composition, exempt, nil_rated';
