import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Resetting database...');

  // Clean existing data
  await prisma.configuration.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('[Seed] Creating seed data...');

  // ── Default Tenant ──
  const tenant = await prisma.tenant.create({
    data: {
      name: 'CyberFrost Demo',
      slug: 'cyberfrost-demo',
      isActive: true,
      plan: 'ENTERPRISE',
      maxUsers: 25,
    },
  });
  console.log(`[Seed] Tenant: ${tenant.name} (${tenant.id})`);

  // ── Admin User ──
  const passwordHash = await bcrypt.hash('Cyber123!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cyberfrost.vercel.app',
      passwordHash,
      name: 'Admin CyberFrost',
      role: 'SUPER_ADMIN',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Admin: ${admin.email} / Cyber123!`);

  // ── Analyst User ──
  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@cyberfrost.vercel.app',
      passwordHash,
      name: 'Security Analyst',
      role: 'SOC_ANALYST',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Analyst: ${analyst.email} / Cyber123!`);

  // ── Viewer User ──
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@cyberfrost.vercel.app',
      passwordHash,
      name: 'Executive Viewer',
      role: 'EXECUTIVE_VIEWER',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Viewer: ${viewer.email} / Cyber123!`);

  // ── SOC Manager ──
  const manager = await prisma.user.create({
    data: {
      email: 'manager@cyberfrost.vercel.app',
      passwordHash,
      name: 'SOC Manager',
      role: 'SOC_MANAGER',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Manager: ${manager.email} / Cyber123!`);

  // ── Tenant Admin ──
  const tenantAdmin = await prisma.user.create({
    data: {
      email: 'tenant-admin@cyberfrost.vercel.app',
      passwordHash,
      name: 'Tenant Administrator',
      role: 'TENANT_ADMIN',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Tenant Admin: ${tenantAdmin.email} / Cyber123!`);

  // ── Security Operator ──
  const operator = await prisma.user.create({
    data: {
      email: 'operator@cyberfrost.vercel.app',
      passwordHash,
      name: 'Security Operator',
      role: 'SECURITY_OPERATOR',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Operator: ${operator.email} / Cyber123!`);

  // ── Compliance Officer ──
  const compliance = await prisma.user.create({
    data: {
      email: 'compliance@cyberfrost.vercel.app',
      passwordHash,
      name: 'Compliance Officer',
      role: 'COMPLIANCE_OFFICER',
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Compliance: ${compliance.email} / Cyber123!`);

  // ── Subscription ──
  const subscription = await prisma.subscription.create({
    data: {
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      tenantId: tenant.id,
    },
  });
  console.log(`[Seed] Subscription: ${subscription.plan} / ${subscription.status}`);

  // ── Configuration ──
  await prisma.configuration.create({
    data: {
      key: 'scan_interval',
      value: '24h',
      tenantId: tenant.id,
    },
  });
  await prisma.configuration.create({
    data: {
      key: 'notification_email',
      value: 'alerts@cyberfrost.vercel.app',
      tenantId: tenant.id,
    },
  });
  console.log('[Seed] Configuration defaults set');

  console.log('\n[Seed] ✅ Database seeded successfully!');
  console.log('[Seed] Login: admin@cyberfrost.vercel.app / Cyber123!');
}

main()
  .catch((e) => {
    console.error('[Seed] ❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
