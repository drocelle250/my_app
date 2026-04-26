import React from "react";
import { Navigate } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";

export default function ProtectedRoute({ children }) {
  const { state } = useInventory();
  if (!state.token) return <Navigate to="/login" replace />;
  return children;
}
