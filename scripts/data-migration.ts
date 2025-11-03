/**
 * Data Migration Script
 * Purpose: Ensure all documents have required orgId field for security rules
 *
 * IMPORTANT: Run this BEFORE deploying updated security rules
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Collections that MUST have orgId
const COLLECTIONS_REQUIRING_ORG_ID = [
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
];

interface MigrationResult {
  collection: string;
  total: number;
  missing: number;
  updated: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
}

async function checkDataMigration(dryRun: boolean = true): Promise<MigrationResult[]> {
  console.log('🔍 Data Migration Check');
  console.log('Mode:', dryRun ? 'DRY RUN (no changes)' : '⚠️  LIVE MODE (will update)');
  console.log('─'.repeat(80));

  const results: MigrationResult[] = [];

  for (const collectionName of COLLECTIONS_REQUIRING_ORG_ID) {
    console.log(`\n📁 Checking ${collectionName}...`);

    const result: MigrationResult = {
      collection: collectionName,
      total: 0,
      missing: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      const snapshot = await getFirestore().collection(collectionName).get();
      result.total = snapshot.size;

      console.log(`   Total documents: ${result.total}`);

      if (result.total === 0) {
        console.log(`   ✓ Collection is empty`);
        results.push(result);
        continue;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Check if orgId exists
        if (!data.orgId) {
          result.missing++;
          console.log(`   ⚠️  Missing orgId: ${doc.id}`);

          // Try to infer orgId from related data
          let inferredOrgId: string | null = null;

          // Strategy 1: Check for siteId and look up site's orgId
          if (data.siteId) {
            try {
              const siteDoc = await getFirestore().collection('sites').doc(data.siteId).get();
              if (siteDoc.exists && siteDoc.data()?.orgId) {
                inferredOrgId = siteDoc.data()!.orgId;
                console.log(`      → Inferred from site: ${inferredOrgId}`);
              }
            } catch (err) {
              console.log(`      → Could not infer from siteId: ${err}`);
            }
          }

          // Strategy 2: Check for assetId and look up asset's orgId
          if (!inferredOrgId && data.assetId) {
            try {
              const assetDoc = await getFirestore().collection('assets').doc(data.assetId).get();
              if (assetDoc.exists && assetDoc.data()?.orgId) {
                inferredOrgId = assetDoc.data()!.orgId;
                console.log(`      → Inferred from asset: ${inferredOrgId}`);
              }
            } catch (err) {
              console.log(`      → Could not infer from assetId: ${err}`);
            }
          }

          // Strategy 3: Check for userId and look up user's orgId
          if (!inferredOrgId && (data.createdBy || data.completedBy)) {
            const userId = data.createdBy || data.completedBy;
            try {
              const userDoc = await getFirestore().collection('users').doc(userId).get();
              if (userDoc.exists && userDoc.data()?.orgId) {
                inferredOrgId = userDoc.data()!.orgId;
                console.log(`      → Inferred from user: ${inferredOrgId}`);
              }
            } catch (err) {
              console.log(`      → Could not infer from userId: ${err}`);
            }
          }

          // Apply the update if not dry run
          if (inferredOrgId && !dryRun) {
            try {
              await doc.ref.update({
                orgId: inferredOrgId,
                updatedAt: new Date(),
                migratedAt: new Date(),
              });
              result.updated++;
              console.log(`      ✓ Updated with orgId: ${inferredOrgId}`);
            } catch (err: any) {
              result.errors++;
              result.errorDetails.push({
                id: doc.id,
                error: err.message,
              });
              console.log(`      ✗ Error updating: ${err.message}`);
            }
          } else if (!inferredOrgId) {
            result.errors++;
            result.errorDetails.push({
              id: doc.id,
              error: 'Could not infer orgId from any source',
            });
            console.log(`      ✗ Cannot infer orgId - MANUAL ACTION REQUIRED`);
          }
        }
      }

      if (result.missing === 0) {
        console.log(`   ✓ All documents have orgId`);
      } else {
        console.log(`   Summary: ${result.missing} missing, ${result.updated} updated, ${result.errors} errors`);
      }

    } catch (err: any) {
      console.error(`   ✗ Error processing collection: ${err.message}`);
      result.errors++;
      result.errorDetails.push({
        id: 'collection',
        error: err.message,
      });
    }

    results.push(result);
  }

  return results;
}

function printSummary(results: MigrationResult[], dryRun: boolean) {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('═'.repeat(80));

  let totalDocs = 0;
  let totalMissing = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  console.log('\n┌─────────────────────┬───────┬─────────┬─────────┬────────┐');
  console.log('│ Collection          │ Total │ Missing │ Updated │ Errors │');
  console.log('├─────────────────────┼───────┼─────────┼─────────┼────────┤');

  for (const result of results) {
    const collectionPadded = result.collection.padEnd(19);
    const totalPadded = result.total.toString().padStart(5);
    const missingPadded = result.missing.toString().padStart(7);
    const updatedPadded = result.updated.toString().padStart(7);
    const errorsPadded = result.errors.toString().padStart(6);

    console.log(`│ ${collectionPadded} │ ${totalPadded} │ ${missingPadded} │ ${updatedPadded} │ ${errorsPadded} │`);

    totalDocs += result.total;
    totalMissing += result.missing;
    totalUpdated += result.updated;
    totalErrors += result.errors;
  }

  console.log('├─────────────────────┼───────┼─────────┼─────────┼────────┤');
  const totalDocsStr = totalDocs.toString().padStart(5);
  const totalMissingStr = totalMissing.toString().padStart(7);
  const totalUpdatedStr = totalUpdated.toString().padStart(7);
  const totalErrorsStr = totalErrors.toString().padStart(6);
  console.log(`│ ${'TOTAL'.padEnd(19)} │ ${totalDocsStr} │ ${totalMissingStr} │ ${totalUpdatedStr} │ ${totalErrorsStr} │`);
  console.log('└─────────────────────┴───────┴─────────┴─────────┴────────┘');

  console.log('\n' + '─'.repeat(80));

  if (dryRun) {
    console.log('ℹ️  This was a DRY RUN - No changes were made');
    if (totalMissing > 0) {
      console.log(`\n⚠️  Found ${totalMissing} documents missing orgId`);
      console.log('   Run with --live flag to apply changes:');
      console.log('   npm run migrate:add-orgid -- --live');
    }
  } else {
    console.log('✓ Migration completed');
    if (totalUpdated > 0) {
      console.log(`   Updated ${totalUpdated} documents`);
    }
  }

  if (totalErrors > 0) {
    console.log(`\n❌ ${totalErrors} errors occurred`);
    console.log('   Error details:');
    for (const result of results) {
      if (result.errorDetails.length > 0) {
        console.log(`\n   ${result.collection}:`);
        for (const error of result.errorDetails) {
          console.log(`      - ${error.id}: ${error.error}`);
        }
      }
    }
    console.log('\n   ⚠️  Manual intervention required for errors');
  }

  console.log('\n' + '═'.repeat(80));

  // Final safety check
  if (!dryRun && (totalMissing > totalUpdated)) {
    console.log('\n⚠️  WARNING: Some documents still missing orgId!');
    console.log('   DO NOT deploy security rules until all documents have orgId');
    console.log('   Check error details above for manual intervention needed');
  } else if (totalMissing === 0) {
    console.log('\n✅ All documents have orgId - Safe to deploy security rules');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');

  if (!dryRun) {
    console.log('⚠️  WARNING: Running in LIVE mode - will update database!');
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS env var)
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      console.log('\nSet it to your service account key file:');
      console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
      process.exit(1);
    }

    initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });

    const results = await checkDataMigration(dryRun);
    printSummary(results, dryRun);

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { checkDataMigration };
