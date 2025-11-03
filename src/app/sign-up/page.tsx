'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';
import { CheckCircle2, Mail } from 'lucide-react';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('token');
  const invitationEmail = searchParams.get('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [validatingInvitation, setValidatingInvitation] = useState(false);
  const [invitationInvalid, setInvitationInvalid] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  // Validate invitation token on page load
  useEffect(() => {
    if (invitationToken && invitationEmail) {
      validateInvitation();
    }
  }, [invitationToken, invitationEmail]);

  const validateInvitation = async () => {
    try {
      setValidatingInvitation(true);

      // Find user by invitation token
      const usersQuery = query(
        collection(db, 'users'),
        where('invitationToken', '==', invitationToken),
        where('email', '==', invitationEmail?.toLowerCase())
      );

      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setInvitationInvalid(true);
        setError('Invalid or expired invitation link');
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Check if invitation has expired
      const expiryDate = userData.invitationExpiry?.toDate();
      if (expiryDate && expiryDate < new Date()) {
        setInvitationInvalid(true);
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        return;
      }

      // Check if user has already accepted
      if (userData.status === 'active') {
        setInvitationInvalid(true);
        setError('This invitation has already been accepted. Please sign in instead.');
        return;
      }

      // Valid invitation - pre-fill form
      setInvitationData({
        userId: userDoc.id,
        ...userData,
      });
      setName(userData.name || '');
      setEmail(userData.email || '');
    } catch (err) {
      console.error('Error validating invitation:', err);
      setInvitationInvalid(true);
      setError('Failed to validate invitation');
    } finally {
      setValidatingInvitation(false);
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
      // Create Firebase Auth account
      await signUp(email, password, name);

      // If this is an invitation sign-up, update the user status
      if (invitationData) {
        await updateDoc(doc(db, 'users', invitationData.userId), {
          status: 'active',
          invitationToken: null, // Clear the token
          acceptedAt: new Date(),
          updatedAt: new Date(),
        });

        // Redirect to dashboard (user already belongs to org)
        router.push('/dashboard');
      } else {
        // Regular sign-up - redirect to organisation setup
        router.push('/setup/organisation');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);

      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating invitation
  if (validatingInvitation) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <div className="text-brand-600">Validating invitation...</div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if invitation is invalid
  if (invitationInvalid) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log</h1>
          </div>
          <Card className="border-l-4 border-l-red-500">
            <Card.Content>
              <div className="py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-900 mb-2">Invalid Invitation</h2>
                  <p className="text-brand-700">{error}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/sign-in">
                    <Button variant="primary" size="lg" className="w-full">
                      Go to Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="secondary" size="lg" className="w-full">
                      Create New Account
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

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-900">Fire Safety Log Book</h1>
          <p className="text-sm text-brand-600 mt-2">
            {invitationData ? 'Complete your account setup' : 'Create your account'}
          </p>
        </div>

        {/* Invitation Notice */}
        {invitationData && (
          <Card className="mb-4 border-l-4 border-l-green-500 bg-green-50">
            <Card.Content>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Invitation Accepted</h3>
                  <p className="text-sm text-green-800 mt-1">
                    You've been invited to join as a{' '}
                    <strong>{invitationData.role.replace(/_/g, ' ')}</strong>.
                    Create a password to complete your account setup.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Sign Up Card */}
        <Card>
          <Card.Header>
            {invitationData ? 'Set Your Password' : 'Sign Up'}
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <FormError message={error} />}

              <Input
                label="Full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                disabled={loading || !!invitationData}
              />

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading || !!invitationData}
                helperText={invitationData ? 'Pre-filled from invitation' : "You'll use this to sign in"}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                helperText="Minimum 8 characters"
              />

              <Input
                label="Confirm password"
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
                {invitationData ? 'Complete Setup' : 'Create Account'}
              </Button>
            </form>

            {!invitationData && (
              <div className="mt-6 pt-6 border-t border-brand-200 text-center text-sm">
                <span className="text-brand-600">Already have an account? </span>
                <Link
                  href="/sign-in"
                  className="text-brand-900 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-brand-500">
          <p>
            By creating an account, you agree to the{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
