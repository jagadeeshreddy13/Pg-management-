import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-10 text-center text-white">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">H</div>
          <h1 className="text-3xl font-bold tracking-tight">HostelPro</h1>
          <p className="text-slate-400 mt-2 text-sm">
            {isForgotPassword 
              ? 'Reset your password' 
              : isSignUp 
                ? 'Create your admin account' 
                : 'Login to your admin dashboard'}
          </p>
        </div>
        
        <form className="p-8 space-y-6" onSubmit={isForgotPassword ? handleForgotPassword : handleAuth}>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-500 uppercase tracking-tighter"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 text-sm uppercase tracking-wide"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>

          <div className="text-center pt-2">
            {!isForgotPassword ? (
              <p className="text-xs text-slate-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-bold text-blue-600 hover:text-blue-500"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                Back to login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
