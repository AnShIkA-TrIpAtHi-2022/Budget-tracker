const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Category = require('./models/Category')
const Expense = require('./models/Expense')
require('dotenv').config()

const seedBasicData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-tracker')
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Expense.deleteMany({})
    console.log('🗑️ Cleared existing data')

    // Create demo user
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('demo123', salt)
    
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@budgettracker.com',
      password: hashedPassword
    })
    console.log('👤 Created demo user')

    // Create categories
    const categories = await Category.insertMany([
      {
        name: 'Food & Dining',
        color: '#EF4444',
        icon: 'utensils',
        user: demoUser._id
      },
      {
        name: 'Transportation',
        color: '#F59E0B',
        icon: 'car',
        user: demoUser._id
      },
      {
        name: 'Shopping',
        color: '#8B5CF6',
        icon: 'shopping-bag',
        user: demoUser._id
      },
      {
        name: 'Entertainment',
        color: '#EC4899',
        icon: 'film',
        user: demoUser._id
      },
      {
        name: 'Bills & Utilities',
        color: '#10B981',
        icon: 'receipt',
        user: demoUser._id
      }
    ])
    console.log('📁 Created categories')

    // Create sample expenses
    const sampleExpenses = []
    const now = new Date()
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      const amount = Math.floor(Math.random() * 100) + 10
      
      sampleExpenses.push({
        title: `Sample expense ${i + 1}`,
        amount,
        category: randomCategory._id,
        date,
        description: `Sample ${randomCategory.name.toLowerCase()} expense`,
        user: demoUser._id
      })
    }

    await Expense.insertMany(sampleExpenses)
    console.log(`💰 Created ${sampleExpenses.length} sample expenses`)

    console.log('\n🎉 Database seeded successfully!')
    console.log('📊 Demo user credentials:')
    console.log('  Email: demo@budgettracker.com')
    console.log('  Password: demo123')
    console.log('\n📋 Database collections created:')
    console.log('  - users (1 record)')
    console.log(`  - categories (${categories.length} records)`)
    console.log(`  - expenses (${sampleExpenses.length} records)`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
if (require.main === module) {
  seedBasicData()
}

module.exports = seedBasicData
