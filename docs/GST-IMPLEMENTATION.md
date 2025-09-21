# GST Implementation Guide for WeBill

## Overview

WeBill has been updated to support Indian GST (Goods and Services Tax) system with INR as the default currency. This implementation includes proper GST calculations, compliance reporting, and Indian business requirements.

## Key Changes

### 1. Currency Changes
- **Default Currency**: Changed from USD to INR (₹)
- **Number Formatting**: Uses Indian locale (en-IN) with lakhs/crores system
- **Exchange Rate Migration**: Existing USD data can be converted to INR

### 2. GST Implementation
- **GST Rates**: Supports 0%, 5%, 12%, 18%, 28% as per Indian GST slabs
- **Tax Breakdown**: CGST, SGST, IGST, and Cess calculations
- **Inter/Intra State**: Automatic detection for IGST vs CGST+SGST
- **HSN/SAC Codes**: Support for Harmonized System codes

### 3. Database Schema Updates

#### New Fields Added:

**Parties Table:**
- `gstNumber` - GST Registration Number (GSTIN)
- `panNumber` - Permanent Account Number (PAN)
- `stateCode` - State code for GST calculations
- `placeOfSupply` - Place of supply for GST

**Items Table:**
- `gstRate` - GST rate for the item (default 18%)
- `hsnCode` - HSN code for goods
- `sacCode` - SAC code for services

**Transactions & Transaction Items:**
- `cgstAmount`, `sgstAmount`, `igstAmount`, `cessAmount` - GST breakdown
- `cgstRate`, `sgstRate`, `igstRate`, `cessRate` - GST rates
- `placeOfSupply` - Place of supply
- `reverseCharge` - Reverse charge mechanism flag

**Invoices & Invoice Items:**
- Same GST fields as transactions
- `gstTreatment` - GST treatment type (REGULAR, COMPOSITION, EXEMPT, etc.)

## Configuration

### Environment Variables (.env)

```env
# Application Configuration
DEFAULT_CURRENCY=INR
DEFAULT_LOCALE=en-IN
DEFAULT_TIMEZONE=Asia/Kolkata

# GST Configuration
GST_RATES=0,5,12,18,28
DEFAULT_GST_RATE=18
CGST_SGST_THRESHOLD=18

# Indian Business Configuration
COMPANY_GSTIN=your-company-gstin
COMPANY_PAN=your-company-pan
COMPANY_STATE_CODE=your-state-code
ENABLE_HSN_SAC=true
```

## Usage

### 1. GST Rate Selection
```tsx
import { GSTRateSelector } from '@/components/ui/gst-rate-selector'

<GSTRateSelector
  value={gstRate}
  onChange={setGstRate}
  label="GST Rate"
  required
/>
```

### 2. GSTIN/PAN Input
```tsx
import { GSTINInput, PANInput } from '@/components/ui/gst-input'

<GSTINInput
  value={gstin}
  onChange={setGstin}
  required
/>

<PANInput
  value={pan}
  onChange={setPan}
  required
/>
```

### 3. GST Calculations
```tsx
import { calculateGST, isInterStateTransaction } from '@/lib/utils'

const isInterState = isInterStateTransaction(supplierState, customerState)
const gstBreakdown = calculateGST(amount, gstRate, isInterState)

// Returns: { cgst, sgst, igst, total }
```

### 4. Currency Formatting
```tsx
import { formatCurrency, formatIndianNumber } from '@/lib/utils'

const formatted = formatCurrency(100000) // ₹1,00,000.00
const number = formatIndianNumber(100000) // 1,00,000.00
```

## Migration

### Converting Existing USD Data to INR

1. **Backup your database** before running migration
2. **Update exchange rate** in `scripts/migrate-usd-to-inr.js`
3. **Run migration**:
   ```bash
   npm run db:migrate-usd-to-inr
   ```

The migration script will:
- Convert all monetary amounts from USD to INR
- Update currency fields to 'INR'
- Set default country to 'India'
- Apply default GST rates to items

## GST Compliance Features

### 1. GST Reports
- **GST Summary**: Output GST, Input GST, Net liability
- **GST Return**: Rate-wise breakdown with CGST/SGST/IGST
- **Tax Liability**: Monthly GST liability calculations
- **Compliance Check**: Missing GST information alerts

### 2. Invoice GST Compliance
- GST breakdown display (CGST/SGST or IGST)
- Place of supply indication
- HSN/SAC codes on line items
- Reverse charge mechanism support
- GST treatment classification

### 3. Validation
- GSTIN format validation (15 characters)
- PAN format validation (10 characters)
- GST rate validation against standard rates
- Inter-state transaction detection

## API Changes

### Tax Reports API (`/api/reports/tax`)
Updated to provide GST-specific data:
```json
{
  "summary": {
    "outputGST": { "total": 18000 },
    "inputGST": { "total": 5000 },
    "netGSTLiability": 13000
  },
  "breakdown": {
    "salesGSTByRate": [
      {
        "rate": 18,
        "taxableAmount": 100000,
        "cgstAmount": 9000,
        "sgstAmount": 9000,
        "igstAmount": 0,
        "totalGSTAmount": 18000
      }
    ]
  }
}
```

## Best Practices

### 1. GST Rate Management
- Use environment variables for GST rates
- Validate rates against standard GST slabs
- Handle rate changes with effective dates

### 2. State Code Management
- Maintain state code mapping
- Use 2-digit state codes as per GST rules
- Validate state codes for compliance

### 3. HSN/SAC Codes
- Maintain HSN code database for goods
- Use SAC codes for services
- Ensure 4-8 digit HSN codes as per requirements

### 4. Place of Supply
- Determine place of supply correctly
- Handle inter-state vs intra-state scenarios
- Consider registered vs unregistered customers

## Testing

### GST Calculation Tests
```bash
npm test -- --testPathPattern=gst
```

### Integration Tests
```bash
npm run test:integration
```

## Troubleshooting

### Common Issues

1. **Migration Errors**
   - Ensure database backup before migration
   - Check exchange rate in migration script
   - Verify database permissions

2. **GST Calculation Issues**
   - Verify state codes are correct
   - Check GST rates configuration
   - Ensure place of supply is set

3. **Validation Errors**
   - GSTIN must be 15 characters
   - PAN must be 10 characters
   - State codes must be 2 digits

## Support

For GST-related queries:
- Check GST official documentation
- Verify with tax consultant
- Test with sample transactions

The implementation follows Indian GST regulations and provides comprehensive support for GST compliance in the WeBill billing application.
