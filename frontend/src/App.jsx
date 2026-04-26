import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { InventoryProvider } from "./context/InventoryContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Categories from "./pages/Categories";
import Users from "./pages/Users";

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
    <InventoryProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/" element={
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </InventoryProvider>
  );
}
