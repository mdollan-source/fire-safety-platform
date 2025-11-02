'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  // Validate token on page load
  useEffect(() => {
    if (!token || !email) {
      setInvalidToken(true);
      setValidating(false);
      setError('Invalid or missing reset link');
      return;
    }

    validateToken();
  }, [token, email]);

  const validateToken = async () => {
    try {
      setValidating(true);

      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInvalidToken(true);
        setError(data.error || 'Invalid or expired reset link');
        return;
      }
    } catch (err: any) {
      console.error('Error validating token:', err);
      setInvalidToken(true);
      setError('Failed to validate reset link');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <div className="text-brand-600">Validating reset link...</div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid token
  if (invalidToken) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          </div>

          <Card className="border-l-4 border-l-red-500">
            <Card.Content>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-900 mb-2">Invalid Reset Link</h2>
                  <p className="text-brand-700">{error}</p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800 text-left rounded mb-6">
                  <p className="font-medium mb-2">Possible reasons:</p>
                  <ul className="space-y-1">
                    <li>• The link has expired (links are valid for 1 hour)</li>
                    <li>• The link has already been used</li>
                    <li>• The link is invalid or incomplete</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href="/forgot-password">
                    <Button variant="primary" size="lg" className="w-full">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button variant="secondary" size="lg" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          </div>

          <Card className="border-l-4 border-l-green-500">
            <Card.Content>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-900 mb-2">Password Reset Successfully!</h2>
                  <p className="text-brand-700 mb-4">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                  <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-800 rounded">
                    Redirecting to sign in page...
                  </div>
                </div>

                <Link href="/sign-in">
                  <Button variant="primary" size="lg" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          <p className="text-sm text-brand-600 mt-2">Create a new password</p>
        </div>

        {/* Reset Password Card */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Reset Password
            </div>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <FormError message={error} />}

              <div className="bg-brand-50 border border-brand-200 p-3 text-sm text-brand-700">
                <p className="font-medium mb-1">Creating a new password for:</p>
                <p className="text-brand-900 font-medium">{email}</p>
              </div>

              <Input
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                helperText="Minimum 8 characters"
              />

              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              <div className="bg-brand-50 border border-brand-200 p-3 text-xs text-brand-700">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>Recommended: Include numbers and symbols</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-200 text-center">
              <Link
                href="/sign-in"
                className="text-sm text-brand-600 hover:text-brand-900 font-medium"
              >
                Cancel and return to Sign In
              </Link>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
