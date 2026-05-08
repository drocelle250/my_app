import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['','','','','','']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendCode = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSuccess('Code sent! Check your email.'); setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  const changeCode = (i, v) => {
    if (!/^[0-9]?$/.test(v)) return;
    const c2 = [...code]; c2[i] = v; setCode(c2);
    if (v && i < 5) document.getElementById('c' + (i+1))?.focus();
  };

  const verifyCode = async (e) => {
    e.preventDefault(); setError('');
    const full = code.join('');
    if (full.length !== 6) return setError('Enter all 6 digits.');
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-reset-code', { email, code: full });
      setResetToken(res.data.resetToken);
      setSuccess('Code verified! Set your new password.'); setStep(3);
    } catch (err) { setError(err.response?.data?.message || 'Invalid code.'); }
    finally { setLoading(false); }
  };

  const resetPass = async (e) => {
    e.preventDefault(); setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword.length < 6) return setError('Min 6 characters.');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { resetToken, newPassword });
      setSuccess('Password reset! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  const sl = newPassword.length < 6 ? 1 : newPassword.length < 9 ? 2 : newPassword.length < 12 ? 3 : 4;
  const sc = ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-violet-700 font-bold text-lg flex items-center gap-2">
          <img src="/logo-icon.svg" alt="SmartStock" className="w-7 h-7" />
          SmartStock
        </Link>
        <Link to="/login" className="text-sm text-violet-600 font-semibold hover:underline">Back to Sign In</Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter Reset Code' : 'Set New Password'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 ? 'Enter your email to receive a 6-digit code'
                : step === 2 ? 'Check your email for the 6-digit code'
                : 'Choose a strong new password'}
            </p>
          </div>
          <div className="flex justify-center gap-3 mb-6">
            {['Email','Verify','Password'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ' + (i+1 <= step ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400')}>
                  {i+1}
                </div>
                <span className={'text-xs ' + (i+1 <= step ? 'text-violet-600 font-medium' : 'text-gray-400')}>{label}</span>
                {i < 2 && <div className={'w-6 h-0.5 ' + (i+1 < step ? 'bg-violet-600' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>
          {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">{success}</div>}
          {step === 1 && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                  placeholder="your@email.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 shadow">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={verifyCode} className="space-y-5">
              <p className="text-sm text-gray-600 text-center mb-3">Code sent to <strong>{email}</strong></p>
              <div className="flex gap-2 justify-center">
                {code.map((digit, i) => (
                  <input key={i} id={'c'+i} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => changeCode(i, e.target.value)}
                    onKeyDown={(e) => e.key==='Backspace' && !digit && i>0 && document.getElementById('c'+(i-1))?.focus()}
                    className={'w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition ' + (digit ? 'border-violet-500 bg-violet-50' : 'border-gray-300')}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading || code.join('').length !== 6} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 shadow">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <p className="text-center"><button type="button" onClick={() => { setStep(1); setCode(['','','','','','']); setError(''); setSuccess(''); }} className="text-sm text-violet-600 hover:underline">Resend code</button></p>
            </form>
          )}
          {step === 3 && (
            <form onSubmit={resetPass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={6} autoFocus value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-16 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                    placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">{showPass ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type={showPass ? 'text' : 'password'} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                  placeholder="Repeat your password" />
              </div>
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">{[1,2,3,4].map((i) => <div key={i} className={'flex-1 h-1.5 rounded-full ' + (sl >= i ? sc[i] : 'bg-gray-200')} />)}</div>
                  <p className="text-xs text-gray-400">{['','Too short','Weak','Good','Strong'][sl]}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 shadow">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 hover:underline">Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}