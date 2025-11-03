/**
 * Query Security Audit Script
 *
 * Scans codebase for Firestore queries and identifies potential security issues
 */

import * as fs from 'fs';
import * as path from 'path';

const ORG_SCOPED_COLLECTIONS = [
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
];

interface QueryIssue {
  file: string;
  line: number;
  collection: string;
  code: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
}

function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        getAllTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function auditFile(filePath: string): QueryIssue[] {
  const issues: QueryIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for collection() calls
    const collectionMatch = line.match(/collection\s*\(\s*\w+\s*,\s*['"`](\w+)['"`]\s*\)/);
    if (collectionMatch) {
      const collection = collectionMatch[1];

      if (ORG_SCOPED_COLLECTIONS.includes(collection)) {
        // Check if orgId filter exists nearby (within 3 lines)
        const context = lines.slice(Math.max(0, index - 2), index + 3).join('\n');
        const hasOrgFilter = context.includes("'orgId'") || context.includes('"orgId"');

        if (!hasOrgFilter) {
          issues.push({
            file: filePath,
            line: lineNum,
            collection,
            code: line.trim(),
            issue: `Collection query without orgId filter`,
            severity: 'critical',
          });
        }
      }
    }

    // Check for getDocs without orgId filter
    if (line.includes('getDocs') || line.includes('getDoc')) {
      ORG_SCOPED_COLLECTIONS.forEach((collection) => {
        if (line.includes(`'${collection}'`) || line.includes(`"${collection}"`)) {
          const context = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
          const hasOrgFilter = context.includes("'orgId'") || context.includes('"orgId"');

          if (!hasOrgFilter) {
            issues.push({
              file: filePath,
              line: lineNum,
              collection,
              code: line.trim(),
              issue: `Query without orgId filter`,
              severity: 'critical',
            });
          }
        }
      });
    }

    // Check for .getAll() calls (uncommon but risky)
    if (line.includes('.getAll()') || line.includes('.get()')) {
      ORG_SCOPED_COLLECTIONS.forEach((collection) => {
        const context = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
        if (context.includes(collection)) {
          issues.push({
            file: filePath,
            line: lineNum,
            collection,
            code: line.trim(),
            issue: `Potential unfiltered .getAll() or .get() call`,
            severity: 'warning',
          });
        }
      });
    }
  });

  return issues;
}

function generateReport(issues: QueryIssue[]) {
  console.log('\n' + '═'.repeat(100));
  console.log('🔍 FIRESTORE QUERY SECURITY AUDIT');
  console.log('═'.repeat(100) + '\n');

  if (issues.length === 0) {
    console.log('✅ No security issues found! All queries appear to be properly filtered.\n');
    return;
  }

  // Group by severity
  const critical = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const info = issues.filter((i) => i.severity === 'info');

  console.log(`Found ${issues.length} potential security issues:\n`);
  console.log(`  🔴 Critical: ${critical.length}`);
  console.log(`  ⚠️  Warning:  ${warnings.length}`);
  console.log(`  ℹ️  Info:     ${info.length}\n`);

  console.log('─'.repeat(100));

  // Print critical issues
  if (critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES (Must Fix):\n');

    critical.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Collection: ${issue.collection}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Review Recommended):\n');

    warnings.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Collection: ${issue.collection}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }

  console.log('─'.repeat(100));
  console.log('\n📋 Remediation Steps:\n');
  console.log('1. Replace raw queries with secure query helpers:');
  console.log('   import { createSecureQuery, querySecure } from "@/lib/firebase/secure-query";\n');
  console.log('2. Update queries to use createSecureQuery():');
  console.log('   const q = createSecureQuery("assets", orgId, where("type", "==", "extinguisher"));\n');
  console.log('3. Or use querySecure() helper:');
  console.log('   const assets = await querySecure("assets", orgId, where("type", "==", "extinguisher"));\n');
  console.log('4. Test with different org accounts to verify isolation\n');

  console.log('═'.repeat(100) + '\n');
}

// Main
async function main() {
  console.log('🔍 Scanning codebase for Firestore queries...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllTsxFiles(srcDir);

  console.log(`Found ${files.length} TypeScript files to analyze\n`);

  const allIssues: QueryIssue[] = [];

  files.forEach((file) => {
    const issues = auditFile(file);
    allIssues.push(...issues);
  });

  generateReport(allIssues);

  // Exit with error code if critical issues found
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  if (criticalCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { auditFile, QueryIssue };
