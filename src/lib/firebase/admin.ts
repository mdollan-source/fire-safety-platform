// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

/**
 * Initialize Firebase Admin SDK
 * Only runs on server-side (API routes, server components)
 */
export function getAdminApp(): App {
  // During build time, return a mock app to prevent initialization errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Firebase Admin: Skipping initialization during build phase');
    return {} as App;
  }

  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0] as App;
    return adminApp;
  }

  // Initialize with service account credentials
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  console.log('=== Firebase Admin Debug ===');
  console.log('Raw key length:', rawPrivateKey?.length);
  console.log('Raw key first 80 chars:', rawPrivateKey?.substring(0, 80));
  console.log('Raw key has literal \\n:', rawPrivateKey?.includes('\\n'));
  console.log('Raw key has actual newlines:', rawPrivateKey?.includes('\n'));

  // Try replacing literal \n with actual newlines
  const privateKey = rawPrivateKey?.replace(/\\n/g, '\n');

  console.log('After replace - key length:', privateKey?.length);
  console.log('After replace - first 80 chars:', privateKey?.substring(0, 80));
  console.log('After replace - has literal \\n:', privateKey?.includes('\\n'));
  console.log('After replace - has actual newlines:', privateKey?.includes('\n'));
  console.log('After replace - starts with BEGIN:', privateKey?.startsWith('-----BEGIN'));
  console.log('After replace - ends with KEY-----:', privateKey?.endsWith('KEY-----'));
  console.log('===========================');

  if (!privateKey || !clientEmail || !projectId) {
    console.error('Firebase Admin: Missing required environment variables');
    console.error('FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? 'SET (length: ' + privateKey.length + ')' : 'MISSING');
    console.error('FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? 'SET' : 'MISSING');
    console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', projectId ? 'SET' : 'MISSING');

    throw new Error(
      'Firebase Admin: Missing required environment variables. ' +
      'Please add FIREBASE_ADMIN_PRIVATE_KEY and FIREBASE_ADMIN_CLIENT_EMAIL'
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    console.log('Firebase Admin: Initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin: Initialization failed:', error);
    throw error;
  }
}

// Export admin services
export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());
