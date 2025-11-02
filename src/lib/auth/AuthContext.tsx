'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set custom claims via API
  const setCustomClaims = async (userId: string): Promise<void> => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.error('No ID token available');
        return;
      }

      const response = await fetch('/api/auth/set-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to set custom claims:', error);
        return;
      }

      // Force token refresh to get new claims
      await auth.currentUser?.getIdToken(true);
      console.log('Custom claims set successfully for user:', userId);
    } catch (error) {
      console.error('Error setting custom claims:', error);
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Refresh user data and claims
  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.uid);
      setUserData(data);

      // Also refresh custom claims
      if (data) {
        await setCustomClaims(user.uid);
      }
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const data = await fetchUserData(firebaseUser.uid);
        setUserData(data);

        // Set custom claims when user signs in (only if user has orgId)
        if (data && data.orgId) {
          await setCustomClaims(firebaseUser.uid);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(newUser, { displayName: name });

      // Note: User document will be created by the user during org setup
      // For now, we just create a minimal user record
      await setDoc(doc(db, 'users', newUser.uid), {
        id: newUser.uid,
        email: newUser.email,
        name: name,
        role: 'responsible_person' as UserRole, // Default role
        mfaEnabled: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        // orgId will be set during organisation creation
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
