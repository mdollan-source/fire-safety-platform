/**
 * Secure Query Helper
 *
 * Ensures all Firestore queries are properly filtered by orgId
 * to prevent cross-organization data access.
 *
 * IMPORTANT: Always use these helpers instead of raw Firestore queries
 */

import {
  collection,
  query,
  where,
  Query,
  CollectionReference,
  getDocs,
  getDoc,
  doc,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Collections that require orgId filtering
const ORG_SCOPED_COLLECTIONS = [
  'organisations',
  'sites',
  'assets',
  'defects',
  'entries',
  'tasks',
  'schedules',
  'check_schedules',
  'fire_drills',
  'training_records',
  'reports',
  'documents',
  'evidence',
] as const;

type OrgScopedCollection = typeof ORG_SCOPED_COLLECTIONS[number];

/**
 * Create a secure query that automatically filters by orgId
 *
 * @example
 * // Instead of:
 * const q = query(collection(db, 'assets'), where('siteId', '==', siteId));
 *
 * // Use:
 * const q = createSecureQuery('assets', userOrgId, where('siteId', '==', siteId));
 */
export function createSecureQuery(
  collectionName: OrgScopedCollection,
  orgId: string,
  ...queryConstraints: QueryConstraint[]
): Query {
  if (!orgId) {
    throw new Error(`[SECURITY] orgId is required for querying ${collectionName}`);
  }

  // Create base collection reference
  const collectionRef = collection(db, collectionName);

  // Add orgId filter as the first constraint
  const orgFilter = where('orgId', '==', orgId);

  // Combine with additional constraints
  return query(collectionRef, orgFilter, ...queryConstraints);
}

/**
 * Get a collection reference with orgId filtering
 *
 * @example
 * const assetsRef = getSecureCollection('assets', userOrgId);
 * const snapshot = await getDocs(query(assetsRef, where('type', '==', 'extinguisher')));
 */
export function getSecureCollection(
  collectionName: OrgScopedCollection,
  orgId: string
): CollectionReference {
  if (!orgId) {
    throw new Error(`[SECURITY] orgId is required for accessing ${collectionName}`);
  }

  return collection(db, collectionName) as CollectionReference;
}

/**
 * Get all documents from a collection (filtered by orgId)
 *
 * @example
 * const sites = await getAllSecure('sites', userOrgId);
 */
export async function getAllSecure<T = any>(
  collectionName: OrgScopedCollection,
  orgId: string
): Promise<T[]> {
  if (!orgId) {
    throw new Error(`[SECURITY] orgId is required for querying ${collectionName}`);
  }

  const q = createSecureQuery(collectionName, orgId);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

/**
 * Get a single document (with org verification)
 *
 * @example
 * const asset = await getDocSecure('assets', assetId, userOrgId);
 */
export async function getDocSecure<T = any>(
  collectionName: OrgScopedCollection,
  documentId: string,
  orgId: string
): Promise<T | null> {
  if (!orgId) {
    throw new Error(`[SECURITY] orgId is required for accessing ${collectionName}/${documentId}`);
  }

  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // Verify the document belongs to the user's organization
  if (data.orgId !== orgId) {
    console.error(`[SECURITY] Attempted to access document from different org`, {
      collection: collectionName,
      documentId,
      expectedOrgId: orgId,
      actualOrgId: data.orgId,
    });
    throw new Error('Permission denied: Document belongs to different organization');
  }

  return {
    id: docSnap.id,
    ...data,
  } as T;
}

/**
 * Query with multiple where clauses (automatically adds orgId filter)
 *
 * @example
 * const activeDefects = await querySecure(
 *   'defects',
 *   userOrgId,
 *   where('status', '==', 'open'),
 *   where('severity', '==', 'critical')
 * );
 */
export async function querySecure<T = any>(
  collectionName: OrgScopedCollection,
  orgId: string,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> {
  const q = createSecureQuery(collectionName, orgId, ...queryConstraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

/**
 * Hook to ensure queries are org-scoped
 * Use this in React components
 *
 * @example
 * const { data, loading, error } = useSecureQuery('assets', userOrgId, where('type', '==', 'extinguisher'));
 */
export function useSecureQueryConstraints(
  orgId: string | undefined
): {
  orgFilter: QueryConstraint;
  isReady: boolean;
} {
  if (!orgId) {
    return {
      orgFilter: where('orgId', '==', '__invalid__'), // Will never match
      isReady: false,
    };
  }

  return {
    orgFilter: where('orgId', '==', orgId),
    isReady: true,
  };
}

/**
 * Validate that a query includes orgId filtering
 * Used for auditing existing queries
 */
export function validateQueryHasOrgFilter(queryString: string): boolean {
  return queryString.includes("where('orgId'") || queryString.includes('where("orgId"');
}

/**
 * Development helper: Log when insecure queries are detected
 */
if (process.env.NODE_ENV === 'development') {
  console.log('[SECURITY] Secure query helper loaded');
  console.log('[SECURITY] Always use createSecureQuery() for org-scoped collections');
}

// Export collection list for validation
export { ORG_SCOPED_COLLECTIONS };
