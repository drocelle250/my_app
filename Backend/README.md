# Inventory Management System - Backend

Node.js REST API for the Inventory Management System.

## Features
- JWT authentication
- Role-based access control (Admin, Manager, Staff)
- Product management
- Category management
- Stock tracking with history
- User management
- Dashboard statistics

## Tech Stack
- Node.js
- Express.js
- MySQL (via Sequelize ORM)
- JWT for authentication
- bcryptjs for password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventory_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Create MySQL database:
```sql
CREATE DATABASE inventory_db;
```

4. Seed the database:
```bash
npm run seed
```

5. Run development server:
```bash
npm run dev
```

## Default Login Credentials

After seeding:
- Admin: `admin@inventory.com` / `Admin@123`
- Manager: `manager@inventory.com` / `Manager@123`
- Staff: `staff@inventory.com` / `Staff@123`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Products
- GET `/api/products` - Get all products
- POST `/api/products` - Create product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### Categories
- GET `/api/categories` - Get all categories
- POST `/api/categories` - Create category
- PUT `/api/categories/:id` - Update category
- DELETE `/api/categories/:id` - Delete category

### Stock
- GET `/api/stock/history` - Get stock history
- POST `/api/stock/adjust` - Adjust stock

### Users (Admin only)
- GET `/api/users` - Get all users
- PUT `/api/users/:id/role` - Update user role

### Dashboard
- GET `/api/products/stats` - Get dashboard statistics

## Deployment

For production deployment:
1. Use a MySQL database service (Railway, PlanetScale, etc.)
2. Update `.env` with production database credentials
3. Set `JWT_SECRET` to a secure random string
4. Deploy to Railway, Render, or similar Node.js hosting
