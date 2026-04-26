# Inventory Management System

A full-stack inventory management system with user authentication, role-based access control, and real-time stock tracking.

## 🚀 Features

- **User Authentication** - Login/Register with JWT
- **Role-Based Access** - Admin, Manager, and Staff roles
- **Product Management** - CRUD operations for products
- **Category Management** - Organize products by categories
- **Stock Tracking** - Track stock changes with history
- **Dashboard** - Statistics and low stock alerts
- **User Management** - Admin can manage users and roles

## 📁 Project Structure

```
my_app/
├── frontend/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
└── Backend/           # Node.js + Express backend
    ├── controllers/
    ├── models/
    ├── routes/
    └── server.js
```

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Context API + useReducer

### Backend
- Node.js
- Express.js
- MySQL (Sequelize ORM)
- JWT Authentication
- bcryptjs

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (XAMPP or standalone)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/drocelle250/my_app.git
cd my_app
```

### 2. Setup Backend

```bash
cd Backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials
# Create database in MySQL
# Then seed the database
npm run seed

# Start backend server
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Create .env file
cp ../.env.example .env

# Start frontend server
npm run dev
```

Frontend runs on: http://localhost:5173

### 4. Login

Default credentials after seeding:
- **Admin:** admin@inventory.com / Admin@123
- **Manager:** manager@inventory.com / Manager@123
- **Staff:** staff@inventory.com / Staff@123

## 📚 Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./Backend/README.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)

## 🌐 Deployment

### Frontend (Netlify)
1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `frontend/dist`
4. Base directory: `frontend`
5. Add environment variable: `VITE_API_URL`

### Backend (Railway/Render)
1. Connect repository to Railway
2. Root directory: `Backend`
3. Add MySQL database
4. Set environment variables
5. Run seed command

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/role` - Update user role

### Dashboard
- `GET /api/products/stats` - Get statistics

## 👤 Author

**drocelle UWAYESU**
- GitHub: [@drocelle250](https://github.com/drocelle250)
- Email: drocelle2007@gmail.com

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
