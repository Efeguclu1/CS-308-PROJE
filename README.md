# CS-308 E-Commerce Platform

## Database Setup

We've simplified the database setup process by consolidating all SQL scripts into a single file. There are two ways to set up the database:

### Option 1: Using the Setup Script (Recommended)

Run the database setup script:

```bash
node setup_database.js
```

This script will:
1. Prompt for your MySQL credentials
2. Check if the database already exists
3. Execute the consolidated SQL script
4. Set up all tables, including the Tax ID feature

### Option 2: Manual Setup

If you prefer to set up the database manually:

```bash
mysql -u your_username -p < database_setup.sql
```

## Features

- Product catalog with categories
- User authentication and authorization
- Shopping cart functionality
- Order processing and tracking
- Payment processing with encrypted payment information
- Tax ID support for business customers
- Invoice generation with Tax ID information
- Refund processing system
- Discount management
- Notification system

## Tax ID Feature

The Tax ID feature allows business customers to:
1. Enter their Tax ID during registration
2. Update their Tax ID in their profile
3. Have their Tax ID appear on invoices for business purchases

## Environment Setup

Create a `.env` file in the root directory with the following contents:

```
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=online_store
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

3. Start the frontend application:
   ```bash
   cd frontend/auth-app
   npm start
   ``` 