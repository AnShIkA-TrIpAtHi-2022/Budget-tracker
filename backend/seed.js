const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Category = require('./models/Category')
const Expense = require('./models/Expense')
const RecurringExpense = require('./models/RecurringExpense')
require('dotenv').config()

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-tracker')
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Expense.deleteMany({})
    await RecurringExpense.deleteMany({})
    console.log('Cleared existing data')

    // Create demo user
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('demo123', salt)
    
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@budgettracker.com',
      password: hashedPassword
    })
    console.log('Created demo user')

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
      },
      {
        name: 'Healthcare',
        color: '#06B6D4',
        icon: 'heart',
        user: demoUser._id
      },
      {
        name: 'Education',
        color: '#3B82F6',
        icon: 'book',
        user: demoUser._id
      },
      {
        name: 'Travel',
        color: '#84CC16',
        icon: 'plane',
        user: demoUser._id
      }
    ])
    console.log('Created categories')

    // Create sample expenses for the last 3 months
    const sampleExpenses = []
    const now = new Date()
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      
      // Generate random expenses based on category
      let amount, title
      switch (randomCategory.name) {
        case 'Food & Dining':
          amount = Math.floor(Math.random() * 50) + 10
          title = ['Lunch at cafe', 'Grocery shopping', 'Dinner out', 'Coffee break'][Math.floor(Math.random() * 4)]
          break
        case 'Transportation':
          amount = Math.floor(Math.random() * 30) + 5
          title = ['Gas station', 'Bus fare', 'Uber ride', 'Parking fee'][Math.floor(Math.random() * 4)]
          break
        case 'Shopping':
          amount = Math.floor(Math.random() * 100) + 20
          title = ['Clothing store', 'Online shopping', 'Home supplies', 'Electronics'][Math.floor(Math.random() * 4)]
          break
        case 'Entertainment':
          amount = Math.floor(Math.random() * 60) + 15
          title = ['Movie tickets', 'Concert', 'Gaming', 'Streaming service'][Math.floor(Math.random() * 4)]
          break
        case 'Bills & Utilities':
          amount = Math.floor(Math.random() * 200) + 50
          title = ['Electricity bill', 'Internet bill', 'Phone bill', 'Water bill'][Math.floor(Math.random() * 4)]
          break
        case 'Healthcare':
          amount = Math.floor(Math.random() * 150) + 25
          title = ['Doctor visit', 'Pharmacy', 'Dental checkup', 'Medicine'][Math.floor(Math.random() * 4)]
          break
        case 'Education':
          amount = Math.floor(Math.random() * 100) + 30
          title = ['Online course', 'Books', 'Workshop', 'Certification'][Math.floor(Math.random() * 4)]
          break
        case 'Travel':
          amount = Math.floor(Math.random() * 300) + 50
          title = ['Flight ticket', 'Hotel booking', 'Travel insurance', 'Vacation'][Math.floor(Math.random() * 4)]
          break
        default:
          amount = Math.floor(Math.random() * 50) + 10
          title = 'Miscellaneous expense'
      }

      // Don't create expenses every day (make it more realistic)
      if (Math.random() > 0.3) {
        sampleExpenses.push({
          title,
          amount,
          category: randomCategory._id,
          date,
          description: `Sample ${randomCategory.name.toLowerCase()} expense`,
          user: demoUser._id
        })
      }
    }

    await Expense.insertMany(sampleExpenses)
    console.log(`Created ${sampleExpenses.length} sample expenses`)

    // Create sample recurring expenses
    const recurringExpenses = [
      {
        title: 'Netflix Subscription',
        amount: 15.99,
        category: categories.find(c => c.name === 'Entertainment')._id,
        frequency: 'monthly',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextDue: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        description: 'Monthly streaming service',
        user: demoUser._id,
        isActive: true
      },
      {
        title: 'Gym Membership',
        amount: 49.99,
        category: categories.find(c => c.name === 'Healthcare')._id,
        frequency: 'monthly',
        startDate: new Date(now.getFullYear(), now.getMonth(), 15),
        nextDue: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        description: 'Monthly gym membership',
        user: demoUser._id,
        isActive: true
      },
      {
        title: 'Car Insurance',
        amount: 125.00,
        category: categories.find(c => c.name === 'Transportation')._id,
        frequency: 'monthly',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextDue: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        description: 'Monthly car insurance premium',
        user: demoUser._id,
        isActive: true
      },
      {
        title: 'Rent',
        amount: 1200.00,
        category: categories.find(c => c.name === 'Bills & Utilities')._id,
        frequency: 'monthly',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextDue: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        description: 'Monthly rent payment',
        user: demoUser._id,
        isActive: true
      }
    ]

    await RecurringExpense.insertMany(recurringExpenses)
    console.log('Created sample recurring expenses')

    console.log('\n🎉 Database seeded successfully!')
    console.log('Demo user credentials:')
    console.log('Email: demo@budgettracker.com')
    console.log('Password: demo123')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
