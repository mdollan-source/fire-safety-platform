'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log</h1>
          </div>

          <Card className="border-l-4 border-l-green-500">
            <Card.Content>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-900 mb-2">Check Your Email</h2>
                  <p className="text-brand-700 mb-4">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                  <div className="bg-green-50 border border-green-200 p-4 text-sm text-green-800 text-left rounded">
                    <p className="font-medium mb-2">What's next?</p>
                    <ul className="space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the reset link in the email</li>
                      <li>• The link expires in 1 hour for security</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href="/sign-in">
                    <Button variant="primary" size="lg" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    Send to Different Email
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          <p className="text-sm text-brand-600 mt-2">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Forgot Password
            </div>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <FormError message={error} />}

              <div className="bg-brand-50 border border-brand-200 p-3 text-sm text-brand-700">
                <p>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                helperText="We'll send reset instructions to this email"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-brand-200 text-center">
              <Link
                href="/sign-in"
                className="text-sm text-brand-600 hover:text-brand-900 font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </Card.Content>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-brand-500">
          <p>
            Don't have an account?{' '}
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
