import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { InventoryProvider } from "./context/InventoryContext";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages
import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import Dashboard     from "./pages/Dashboard";
import Shop          from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import MyOrders      from "./pages/MyOrders";
import Products      from "./pages/Products";
import ProductForm   from "./pages/ProductForm";
import Categories    from "./pages/Categories";
import Users         from "./pages/Users";
import Stock         from "./pages/Stock";
import Analytics     from "./pages/Analytics";
import OrdersAdmin   from "./pages/OrdersAdmin";
import AIPredictions from "./pages/AIPredictions";
import ForgotPassword from "./pages/ForgotPassword";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <InventoryProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public ── */}
              <Route path="/"                  element={<Landing />} />
              <Route path="/login"             element={<Login />} />
              <Route path="/register"          element={<Register />} />
              <Route path="/forgot-password"   element={<ForgotPassword />} />

              {/* ── Customer (own layout, no admin navbar) ── */}
              <Route path="/shop" element={
                <ProtectedRoute><Shop /></ProtectedRoute>
              } />
              <Route path="/shop/product/:id" element={
                <ProtectedRoute><ProductDetail /></ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute><MyOrders /></ProtectedRoute>
              } />

              {/* ── Admin / Manager ── */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>
              } />
              <Route path="/products/add" element={
                <ProtectedRoute><Layout><ProductForm /></Layout></ProtectedRoute>
              } />
              <Route path="/products/edit/:id" element={
                <ProtectedRoute><Layout><ProductForm /></Layout></ProtectedRoute>
              } />
              <Route path="/categories" element={
                <ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>
              } />
              <Route path="/stock" element={
                <ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><Layout><OrdersAdmin /></Layout></ProtectedRoute>
              } />
              <Route path="/ai-predictions" element={
                <ProtectedRoute><Layout><AIPredictions /></Layout></ProtectedRoute>
              } />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </InventoryProvider>
    </ErrorBoundary>
  );
}
