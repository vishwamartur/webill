const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: {
        name: 'Office Supplies',
        description: 'Office equipment and supplies',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Software' },
      update: {},
      create: {
        name: 'Software',
        description: 'Software licenses and subscriptions',
      },
    }),
  ])

  console.log('✅ Created categories:', categories.length)

  // Create sample parties (customers and suppliers)
  const parties = await Promise.all([
    prisma.party.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        type: 'CUSTOMER',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        address: '123 Main St, Anytown, USA',
        isActive: true,
      },
    }),
    prisma.party.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        type: 'CUSTOMER',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0102',
        address: '456 Oak Ave, Somewhere, USA',
        isActive: true,
      },
    }),
    prisma.party.upsert({
      where: { email: 'supplier@techcorp.com' },
      update: {},
      create: {
        type: 'SUPPLIER',
        name: 'TechCorp Supplies',
        email: 'supplier@techcorp.com',
        phone: '+1-555-0201',
        address: '789 Business Blvd, Commerce City, USA',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created parties:', parties.length)

  // Create sample items
  const items = await Promise.all([
    prisma.item.upsert({
      where: { sku: 'LAPTOP-001' },
      update: {},
      create: {
        name: 'Business Laptop',
        description: 'High-performance laptop for business use',
        sku: 'LAPTOP-001',
        categoryId: categories[0].id,
        unitPrice: 1299.99,
        stockQuantity: 50,
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'DESK-001' },
      update: {},
      create: {
        name: 'Office Desk',
        description: 'Ergonomic office desk',
        sku: 'DESK-001',
        categoryId: categories[1].id,
        unitPrice: 299.99,
        stockQuantity: 25,
        isActive: true,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'SW-001' },
      update: {},
      create: {
        name: 'Office Suite License',
        description: 'Annual office software license',
        sku: 'SW-001',
        categoryId: categories[2].id,
        unitPrice: 199.99,
        stockQuantity: 100,
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created items:', items.length)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
