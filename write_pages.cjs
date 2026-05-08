const fs = require('fs');

const forgot = [
  "import { useState } from 'react';",
  "import { Link, useNavigate } from 'react-router-dom';",
  "import API from '../api';",
  "",
  "export default function ForgotPassword() {",
  "  const navigate = useNavigate();",
  "  const [step, setStep] = useState(1);",
  "  const [email, setEmail] = useState('');",
  "  const [code, setCode] = useState(['','','','','','']);",
  "  const [resetToken, setResetToken] = useState('');",
  "  const [newPassword, setNewPassword] = useState('');",
  "  const [confirmPassword, setConfirmPassword] = useState('');",
  "  const [showPass, setShowPass] = useState(false);",
  "  const [loading, setLoading] = useState(false);",
  "  const [error, setError] = useState('');",
  "  const [success, setSuccess] = useState('');"
].join('\n');

fs.writeFileSync('my_app/frontend/src/pages/ForgotPassword.jsx', forgot, 'utf8');
console.log('written');
