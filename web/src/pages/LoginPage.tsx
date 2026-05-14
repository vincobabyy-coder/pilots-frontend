import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/forms/LoginForm';
import { useNotification } from '@/context/NotificationContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (data: { email: string; password: string }) => {
    setError('');
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
      notify('error', 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-secondary/10 via-surface-2 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-2xl">flight_takeoff</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">PILOTS</h1>
            <p className="text-xs text-text-muted">Logistics Intelligence Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="card shadow-modal">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Welcome back</h2>
          <p className="text-sm text-text-muted mb-6">Sign in to your dispatcher account</p>

          <LoginForm onSubmit={handleLogin} error={error} />
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © {new Date().getFullYear()} PILOTS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
