const mongoose = require('mongoose')
const Category = require('./models/Category')
require('dotenv').config()

const categories = [
  { name: 'Food & Dining', color: '#ef4444', icon: 'utensils' },
  { name: 'Transportation', color: '#3b82f6', icon: 'car' },
  { name: 'Shopping', color: '#8b5cf6', icon: 'shopping-bag' },
  { name: 'Entertainment', color: '#f59e0b', icon: 'film' },
  { name: 'Utilities', color: '#10b981', icon: 'zap' },
  { name: 'Healthcare', color: '#ec4899', icon: 'heart' },
  { name: 'Education', color: '#6366f1', icon: 'book' },
  { name: 'Travel', color: '#14b8a6', icon: 'plane' }
]

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-tracker')
    
    console.log('Connected to MongoDB')
    
    // Clear existing categories
    await Category.deleteMany({})
    console.log('Cleared existing categories')
    
    // Insert default categories
    await Category.insertMany(categories)
    console.log('Default categories seeded successfully')
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding categories:', error)
    process.exit(1)
  }
}

seedCategories()
