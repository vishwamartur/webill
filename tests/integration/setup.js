const { execSync } = require('child_process')

module.exports = async () => {
  console.log('Setting up integration test environment...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/webill_test'
  
  try {
    // Reset test database
    console.log('Resetting test database...')
    execSync('npx prisma migrate reset --force --skip-seed', { 
      stdio: 'inherit',
      env: process.env 
    })
    
    // Run migrations
    console.log('Running database migrations...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: process.env 
    })
    
    // Generate Prisma client
    console.log('Generating Prisma client...')
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: process.env 
    })
    
    console.log('Integration test setup complete!')
  } catch (error) {
    console.error('Failed to setup integration test environment:', error)
    process.exit(1)
  }
}
