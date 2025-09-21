const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Exchange rate from USD to INR (you should update this with current rate)
const USD_TO_INR_RATE = 83.0 // As of 2024, adjust as needed

async function migrateUSDToINR() {
  console.log('🔄 Starting USD to INR migration...')
  console.log(`📊 Using exchange rate: 1 USD = ${USD_TO_INR_RATE} INR`)

  try {
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Party credit limits
      console.log('📝 Updating party credit limits...')
      const partiesUpdated = await tx.party.updateMany({
        where: {
          creditLimit: {
            not: null
          }
        },
        data: {
          creditLimit: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${partiesUpdated.count} party credit limits`)

      // 2. Update Item prices
      console.log('📝 Updating item prices...')
      const itemsUpdated = await tx.item.updateMany({
        data: {
          unitPrice: {
            multiply: USD_TO_INR_RATE
          },
          costPrice: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${itemsUpdated.count} item prices`)

      // 3. Update Transaction amounts
      console.log('📝 Updating transaction amounts...')
      const transactionsUpdated = await tx.transaction.updateMany({
        data: {
          subtotal: {
            multiply: USD_TO_INR_RATE
          },
          taxAmount: {
            multiply: USD_TO_INR_RATE
          },
          discountAmount: {
            multiply: USD_TO_INR_RATE
          },
          totalAmount: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${transactionsUpdated.count} transaction amounts`)

      // 4. Update Transaction Item amounts
      console.log('📝 Updating transaction item amounts...')
      const transactionItemsUpdated = await tx.transactionItem.updateMany({
        data: {
          unitPrice: {
            multiply: USD_TO_INR_RATE
          },
          discount: {
            multiply: USD_TO_INR_RATE
          },
          totalAmount: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${transactionItemsUpdated.count} transaction item amounts`)

      // 5. Update Invoice amounts
      console.log('📝 Updating invoice amounts...')
      const invoicesUpdated = await tx.invoice.updateMany({
        data: {
          subtotal: {
            multiply: USD_TO_INR_RATE
          },
          taxAmount: {
            multiply: USD_TO_INR_RATE
          },
          discountAmount: {
            multiply: USD_TO_INR_RATE
          },
          totalAmount: {
            multiply: USD_TO_INR_RATE
          },
          paidAmount: {
            multiply: USD_TO_INR_RATE
          },
          balanceAmount: {
            multiply: USD_TO_INR_RATE
          },
          currency: 'INR'
        }
      })
      console.log(`✅ Updated ${invoicesUpdated.count} invoice amounts`)

      // 6. Update Invoice Item amounts
      console.log('📝 Updating invoice item amounts...')
      const invoiceItemsUpdated = await tx.invoiceItem.updateMany({
        data: {
          unitPrice: {
            multiply: USD_TO_INR_RATE
          },
          discount: {
            multiply: USD_TO_INR_RATE
          },
          totalAmount: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${invoiceItemsUpdated.count} invoice item amounts`)

      // 7. Update Payment amounts
      console.log('📝 Updating payment amounts...')
      const paymentsUpdated = await tx.payment.updateMany({
        data: {
          amount: {
            multiply: USD_TO_INR_RATE
          }
        }
      })
      console.log(`✅ Updated ${paymentsUpdated.count} payment amounts`)

      // 8. Set default country to India for parties without country
      console.log('📝 Setting default country to India...')
      const countriesUpdated = await tx.party.updateMany({
        where: {
          OR: [
            { country: null },
            { country: '' },
            { country: 'USA' },
            { country: 'United States' }
          ]
        },
        data: {
          country: 'India'
        }
      })
      console.log(`✅ Updated ${countriesUpdated.count} party countries`)

      // 9. Set default GST rates for items
      console.log('📝 Setting default GST rates for items...')
      const gstRatesUpdated = await tx.item.updateMany({
        where: {
          gstRate: {
            equals: 0
          }
        },
        data: {
          gstRate: 18 // Default GST rate
        }
      })
      console.log(`✅ Updated ${gstRatesUpdated.count} item GST rates`)

      console.log('🎉 Migration completed successfully!')
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateUSDToINR()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateUSDToINR, USD_TO_INR_RATE }
