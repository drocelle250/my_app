// ResetPassword is handled inside ForgotPassword.jsx (3-step flow)
// This file redirects to /forgot-password
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function ResetPassword() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/forgot-password', { replace: true }); }, []);
  return null;
}
