'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          <p className="text-sm text-brand-600 mt-2">Digital compliance platform</p>
        </div>

        {/* Sign In Card */}
        <Card>
          <Card.Header>Sign In</Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <FormError message={error} />}

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-brand-300"
                  />
                  <span className="text-brand-700">Remember me</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-brand-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-200 text-center text-sm">
              <span className="text-brand-600">Don't have an account? </span>
              <Link
                href="/sign-up"
                className="text-brand-900 font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>
          </Card.Content>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-brand-500">
          <p>By signing in, you agree to comply with UK Fire Safety Order requirements</p>
        </div>
      </div>
    </div>
  );
}
