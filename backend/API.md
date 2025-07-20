
# Budget Tracker API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
- **POST** `/users/register`
- **Body**: 
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object with JWT token

#### Login User
- **POST** `/users/login`
- **Body**: 
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object with JWT token

#### Get Current User
- **GET** `/users/me`
- **Auth**: Required
- **Response**: Current user object

### Categories

#### Get All Categories
- **GET** `/categories`
- **Auth**: Required
- **Response**: Array of user's categories

#### Create Category
- **POST** `/categories`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "name": "Food & Dining",
    "color": "#EF4444",
    "icon": "utensils"
  }
  ```

#### Update Category
- **PUT** `/categories/:id`
- **Auth**: Required
- **Body**: Category fields to update

#### Delete Category
- **DELETE** `/categories/:id`
- **Auth**: Required
- **Note**: Cannot delete category if it has associated expenses

#### Initialize Default Categories
- **POST** `/categories/initialize`
- **Auth**: Required
- **Description**: Creates default categories for new users

### Expenses

#### Get All Expenses
- **GET** `/expenses`
- **Auth**: Required
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 50)
  - `category` - Filter by category ID
  - `startDate` - Filter expenses from this date
  - `endDate` - Filter expenses to this date
  - `minAmount` - Minimum amount filter
  - `maxAmount` - Maximum amount filter
  - `sortBy` (default: 'date')
  - `sortOrder` (default: 'desc')

#### Create Expense
- **POST** `/expenses`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "title": "Lunch at restaurant",
    "amount": 25.50,
    "category": "category_id",
    "date": "2024-01-15",
    "description": "Business lunch"
  }
  ```

#### Update Expense
- **PUT** `/expenses/:id`
- **Auth**: Required
- **Body**: Expense fields to update

#### Delete Expense
- **DELETE** `/expenses/:id`
- **Auth**: Required

#### Delete Multiple Expenses
- **DELETE** `/expenses`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "ids": ["expense_id_1", "expense_id_2"]
  }
  ```

### Recurring Expenses

#### Get All Recurring Expenses
- **GET** `/recurring`
- **Auth**: Required
- **Query Parameters**:
  - `status` - 'active' or 'inactive'
  - `frequency` - 'daily', 'weekly', 'monthly', 'yearly'

#### Create Recurring Expense
- **POST** `/recurring`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "title": "Netflix Subscription",
    "amount": 15.99,
    "category": "category_id",
    "frequency": "monthly",
    "startDate": "2024-01-01",
    "description": "Monthly streaming service"
  }
  ```

#### Update Recurring Expense
- **PUT** `/recurring/:id`
- **Auth**: Required
- **Body**: Recurring expense fields to update

#### Delete Recurring Expense
- **DELETE** `/recurring/:id`
- **Auth**: Required

#### Process Due Recurring Expenses
- **POST** `/recurring/process`
- **Auth**: Required
- **Description**: Creates expenses for all due recurring expenses

#### Process Specific Recurring Expense
- **POST** `/recurring/:id/process`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "date": "2024-01-15" // Optional, defaults to current date
  }
  ```

#### Toggle Recurring Expense Status
- **PATCH** `/recurring/:id/toggle`
- **Auth**: Required
- **Description**: Toggles active/inactive status

### Analytics

#### Get Dashboard Overview
- **GET** `/analytics/dashboard`
- **Auth**: Required
- **Query Parameters**:
  - `period` - 'week', 'month', or 'year' (default: 'month')

#### Get Spending Trends
- **GET** `/analytics/trends`
- **Auth**: Required
- **Query Parameters**:
  - `period` - Period type (default: 'month')
  - `months` - Number of months to include (default: 12)

#### Get Category Analysis
- **GET** `/analytics/categories`
- **Auth**: Required
- **Query Parameters**:
  - `startDate` - Analysis start date
  - `endDate` - Analysis end date
  - `limit` - Number of categories to return (default: 10)

#### Get Monthly Comparison
- **GET** `/analytics/monthly-comparison`
- **Auth**: Required
- **Description**: Compares current month with previous month

#### Get Daily Spending Pattern
- **GET** `/analytics/daily-pattern`
- **Auth**: Required
- **Query Parameters**:
  - `days` - Number of days to analyze (default: 30)

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Response Format

Successful responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "count": 10, // For array responses
  "pagination": { // For paginated responses
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

## Getting Started

1. Start the server: `npm run dev`
2. The API will be available at `http://localhost:3001`
3. Use the seed script to create demo data: `npm run seed`
4. Demo user credentials:
   - Email: `demo@budgettracker.com`
   - Password: `demo123`
