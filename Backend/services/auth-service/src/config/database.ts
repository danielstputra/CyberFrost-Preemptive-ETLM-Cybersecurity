import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient;

function createClient(url?: string): PrismaClient {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
}

export function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = createClient();
  return _prisma;
}

export function replacePrisma(url: string): PrismaClient {
  if (_prisma) _prisma.$disconnect();
  _prisma = createClient(url);
  return _prisma;
}

// Initialize default
getPrisma();
