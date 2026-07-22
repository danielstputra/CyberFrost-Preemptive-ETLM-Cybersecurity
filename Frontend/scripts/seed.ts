/**
 * Seed Script — @faker-js/faker
 * ===============================
 * Generates realistic mock data for local development.
 *
 * Usage:
 *   pnpm seed                # Generate all seed data
 *   pnpm seed users          # Only users
 *
 * Examples:
 *   pnpm seed           → creates seed-data.json with users, takedowns, etc.
 */

import { faker } from '@faker-js/faker';

// ──────────────────────────────────────
// Interfaces
// ──────────────────────────────────────

interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SOC_MANAGER' | 'SOC_ANALYST' | 'TENANT_ADMIN' | 'SECURITY_OPERATOR';
  isActive: boolean;
  tenantId: string;
}

interface SeedTakedown {
  id: string;
  targetUrl: string;
  domain: string;
  threatType: 'PHISHING' | 'MALWARE' | 'TRADEMARK';
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'SUCCESSFUL' | 'REJECTED';
  submittedAt: string;
}

// ──────────────────────────────────────
// Generators
// ──────────────────────────────────────

function generateUsers(count: number): SeedUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement([
      'SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR',
    ] as const),
    isActive: faker.datatype.boolean(0.9),
    tenantId: faker.string.uuid(),
  }));
}

function generateTakedowns(count: number): SeedTakedown[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    targetUrl: faker.internet.url(),
    domain: faker.internet.domainName(),
    threatType: faker.helpers.arrayElement(['PHISHING', 'MALWARE', 'TRADEMARK'] as const),
    status: faker.helpers.arrayElement([
      'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'SUCCESSFUL', 'REJECTED',
    ] as const),
    submittedAt: faker.date.recent({ days: 30 }).toISOString(),
  }));
}

// ──────────────────────────────────────
// Main
// ──────────────────────────────────────

async function main() {
  const fs = await import('fs');
  const args = process.argv.slice(2);
  const section = args[0] || 'all';

  const seedData: Record<string, unknown> = {};

  if (section === 'all' || section === 'users') {
    seedData.users = generateUsers(10);
    console.log(`✓ Generated ${(seedData.users as SeedUser[]).length} users`);
  }

  if (section === 'all' || section === 'takedowns') {
    seedData.takedowns = generateTakedowns(20);
    console.log(`✓ Generated ${(seedData.takedowns as SeedTakedown[]).length} takedowns`);
  }

  fs.writeFileSync('./seed-data.json', JSON.stringify(seedData, null, 2));
  console.log('✓ Written to seed-data.json');
}

main().catch(console.error);
