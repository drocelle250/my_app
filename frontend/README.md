# Inventory Management System - Frontend

React-based frontend for the Inventory Management System.

## Features
- User authentication (Login/Register)
- Dashboard with statistics and low stock alerts
- Product management (CRUD operations)
- Category management
- User management (Admin only)
- Role-based access control

## Tech Stack
- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Context API + useReducer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root of frontend folder:
```
VITE_API_URL=http://localhost:5000/api
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Deployment

This app is configured for Netlify deployment with SPA routing support.

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: `frontend`
